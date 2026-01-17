
import { Injectable, Inject, Logger } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { v4 as uuidv4 } from 'uuid';
import { IEventRepository, I_EVENT_REPOSITORY } from '../../domain/ports/event.repository.interface';
import { ITicketClaimRepository, I_TICKET_CLAIM_REPOSITORY } from '../../domain/ports/ticket-claim.repository.interface';
import { ITicketRepository, I_TICKET_REPOSITORY } from '../../domain/ports/ticket.repository.interface';
import { IQRCodeService, I_QRCODE_SERVICE } from '../../domain/ports/qrcode.service.interface';
import { IMessagingService } from '../../../common/messaging/messaging.service.interface';
import { TicketClaimStatus } from '../../domain/ticket-claim.entity';
import { Ticket, TicketStatus } from '../../domain/ticket.entity';

@Injectable()
export class ClaimTicketUseCase {
  private readonly logger = new Logger(ClaimTicketUseCase.name);

  constructor(
    @Inject(I_EVENT_REPOSITORY) private readonly eventRepository: IEventRepository,
    @Inject(I_TICKET_CLAIM_REPOSITORY) private readonly claimRepository: ITicketClaimRepository,
    @Inject(I_TICKET_REPOSITORY) private readonly ticketRepository: ITicketRepository,
    @Inject(I_QRCODE_SERVICE) private readonly qrCodeService: IQRCodeService,
    private readonly em: EntityManager,
  ) {}

  async execute(token: string, userPhone: string, messagingService: IMessagingService): Promise<void> {
    await this.em.transactional(async (em) => {
        // 1. Find Claim
        const claim = await this.claimRepository.findByToken(token);
        
        if (!claim) {
            this.logger.warn(`Claim attempt with invalid token: ${token}`);
            throw new Error('Jeton invalide.');
        }

        if (claim.status !== TicketClaimStatus.PENDING) {
            this.logger.warn(`Claim attempt for non-pending token: ${token} (Status: ${claim.status})`);
            throw new Error('Ce billet a déjà été récupéré.');
        }

        // 2. Mark Claim as USED
        claim.claim(userPhone);
        await this.claimRepository.save(claim);

        // 3. Fetch Event
        const event = await this.eventRepository.findById(claim.eventId);
        if (!event) {
             throw new Error('Événement introuvable.');
        }

        // 4. Generate Ticket
        const ticketId = uuidv4();
        const signedPayload = this.qrCodeService.generateSignedPayload(ticketId);
        
        const ticket = new Ticket(
          ticketId,
          claim.eventId,
          userPhone,
          TicketStatus.VALID,
          signedPayload
        );
        
        await this.ticketRepository.save(ticket);
        
        // 5. Generate QR Image
        const qrBuffer = await this.qrCodeService.generateQRCode(signedPayload);

        // 6. Send to User via platform-agnostic messaging
        await messagingService.sendMessage(userPhone, `✅ Billet récupéré pour *${event.name}* !`);
        await messagingService.sendDocument(
            userPhone,
            qrBuffer,
            `ticket-${event.name}.png`,
            `🎫 Votre Billet (Entrée Unique)`
        );
        
        this.logger.log(`Ticket claimed via token ${token} for user ${userPhone}`);
    });
  }
}
