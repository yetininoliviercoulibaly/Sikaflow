
import { Injectable, Inject, Logger } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { IEventRepository, I_EVENT_REPOSITORY } from '../../domain/ports/event.repository.interface';
import { ITicketRepository, I_TICKET_REPOSITORY } from '../../domain/ports/ticket.repository.interface';
import { ITicketCategoryRepository, I_TICKET_CATEGORY_REPOSITORY } from '../../domain/ports/ticket-category.repository.interface';
import { IQRCodeService, I_QRCODE_SERVICE } from '../../domain/ports/qrcode.service.interface';
import { IMessagingService } from '../../../common/messaging/messaging.service.interface';
import { Ticket, TicketStatus } from '../../domain/ticket.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class IssueTicketUseCase {
  private readonly logger = new Logger(IssueTicketUseCase.name);

  constructor(
    @Inject(I_EVENT_REPOSITORY) private readonly eventRepository: IEventRepository,
    @Inject(I_TICKET_REPOSITORY) private readonly ticketRepository: ITicketRepository,
    @Inject(I_TICKET_CATEGORY_REPOSITORY) private readonly categoryRepository: ITicketCategoryRepository,
    @Inject(I_QRCODE_SERVICE) private readonly qrCodeService: IQRCodeService,
    private readonly em: EntityManager,
  ) {}

  async execute(
    attendeePhone: string, 
    eventId: string, 
    amountPaid: number, 
    quantity: number = 1,
    messagingService: IMessagingService,
    categoryId?: string // Optional: if not provided, uses default category
  ): Promise<void> {
    await this.em.transactional(async (em) => {
      // 1. Fetch Event
      const event = await this.eventRepository.findById(eventId);
      
      if (!event) {
        throw new Error('Event not found');
      }

      // 2. Resolve Category
      let category = categoryId 
        ? await this.categoryRepository.findById(categoryId)
        : await this.categoryRepository.findDefaultByEventId(eventId);
      
      // Fallback: get first category if no default
      if (!category) {
        const categories = await this.categoryRepository.findByEventId(eventId);
        if (categories.length > 0) {
          category = categories[0];
        }
      }

      // 3. Inventory Check (Category-based if available, else event-level)
      if (category) {
        if (!category.canSell(quantity)) {
          this.logger.warn(`Sold Out for category ${category.name} on event ${eventId}`);
          await messagingService.sendMessage(attendeePhone, 
            `❌ Désolé, la catégorie '${category.name}' pour '${event.name}' est complète. Votre paiement sera remboursé.`
          );
          return;
        }
        category.incrementSold(quantity);
        await this.categoryRepository.update(category);
      } else {
        // Legacy: use event-level capacity
        try {
          event.incrementSold(quantity);
        } catch (e) {
          this.logger.warn(`Sold Out for event ${eventId}`);
          await messagingService.sendMessage(attendeePhone, 
            `❌ Désolé, l'événement '${event.name}' est complet. Votre paiement sera remboursé.`
          );
          return;
        }
        await this.eventRepository.save(event);
      }

      // 4. Create N Tickets
      const tickets: Ticket[] = [];
      const qrBuffers: Buffer[] = [];
      const categoryName = category?.name || 'Standard';

      for (let i = 0; i < quantity; i++) {
          const ticketId = uuidv4();
          const signedPayload = this.qrCodeService.generateSignedPayload(ticketId);
          
          const ticket = new Ticket(
            ticketId,
            eventId,
            attendeePhone,
            TicketStatus.VALID,
            signedPayload,
            new Date(),
            undefined,
            category?.id // Link to category
          );
          tickets.push(ticket);
          
          await this.ticketRepository.save(ticket);
          
          const qrBuffer = await this.qrCodeService.generateQRCode(signedPayload);
          qrBuffers.push(qrBuffer);
      }

      // 5. Send via platform-agnostic messaging
      const currencyDisplay = process.env.DEFAULT_CURRENCY || 'EUR';
      const categoryLabel = category ? ` (${categoryName})` : '';
      await messagingService.sendMessage(attendeePhone, 
        `✅ Paiement reçu (${amountPaid} ${currencyDisplay}) !\nVoici vos ${quantity} billet(s)${categoryLabel} pour *${event.name}*.`
      );

      for (let i = 0; i < qrBuffers.length; i++) {
           await messagingService.sendDocument(
            attendeePhone,
            qrBuffers[i],
            `ticket-${event.name}-${categoryName}-${i+1}.png`,
            `🎫 Billet ${i+1}/${quantity} - ${categoryName}`
          );
      }
    });
  }
}
