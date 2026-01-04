
import { Injectable, Inject, Logger } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { IEventRepository, I_EVENT_REPOSITORY } from '../../domain/ports/event.repository.interface';
import { ITicketRepository, I_TICKET_REPOSITORY } from '../../domain/ports/ticket.repository.interface';
import { IQRCodeService, I_QRCODE_SERVICE } from '../../domain/ports/qrcode.service.interface';
import { IWhatsAppService, I_WHATSAPP_SERVICE } from '../../../common/whatsapp/whatsapp.service.interface';
import { Ticket, TicketStatus } from '../../domain/ticket.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class IssueTicketUseCase {
  private readonly logger = new Logger(IssueTicketUseCase.name);

  constructor(
    @Inject(I_EVENT_REPOSITORY) private readonly eventRepository: IEventRepository,
    @Inject(I_TICKET_REPOSITORY) private readonly ticketRepository: ITicketRepository,
    @Inject(I_QRCODE_SERVICE) private readonly qrCodeService: IQRCodeService,
    @Inject(I_WHATSAPP_SERVICE) private readonly whatsAppService: IWhatsAppService,
    private readonly em: EntityManager,
  ) {}

  async execute(attendeePhone: string, eventId: string, amountPaid: number, quantity: number = 1): Promise<void> {
    await this.em.transactional(async (em) => {
      // 1. Fetch Event
      const event = await this.eventRepository.findById(eventId);
      
      if (!event) {
        throw new Error('Event not found');
      }

      // 2. Inventory Check
      try {
        event.incrementSold(quantity);
      } catch (e) {
        this.logger.warn(`Sold Out for event ${eventId}`);
        await this.whatsAppService.sendMessage(attendeePhone, `❌ Désolé, l'événement '${event.name}' est complet (ou pas assez de places). Votre paiement sera remboursé.`);
        // TODO: Trigger Refund Logic
        return;
      }

      // 3. Create N Tickets
      const tickets: Ticket[] = [];
      const qrBuffers: Buffer[] = [];

      for (let i = 0; i < quantity; i++) {
          const ticketId = uuidv4();
          const signedPayload = this.qrCodeService.generateSignedPayload(ticketId);
          
          const ticket = new Ticket(
            ticketId,
            eventId,
            attendeePhone,
            TicketStatus.VALID,
            signedPayload
          );
          tickets.push(ticket);
          
          await this.ticketRepository.save(ticket);
          
          const qrBuffer = await this.qrCodeService.generateQRCode(signedPayload);
          qrBuffers.push(qrBuffer);
      }

      // 4. Persistence
      await this.eventRepository.save(event);

      // 5. Send to WhatsApp
      await this.whatsAppService.sendMessage(attendeePhone, `✅ Paiement reçu (${amountPaid} FCFA) !\nVoici vos ${quantity} billet(s) pour *${event.name}*.`);

      for (let i = 0; i < qrBuffers.length; i++) {
           await this.whatsAppService.sendDocument(
            attendeePhone,
            qrBuffers[i],
            `ticket-${event.name}-${i+1}.png`,
            `🎫 Billet ${i+1}/${quantity}`
          );
      }
    });
  }
}
