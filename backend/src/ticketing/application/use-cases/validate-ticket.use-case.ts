import { Injectable, Inject, Logger } from '@nestjs/common';
import { ITicketRepository, I_TICKET_REPOSITORY } from '../../domain/ports/ticket.repository.interface';
import { IEventRepository, I_EVENT_REPOSITORY } from '../../domain/ports/event.repository.interface';
import { IQRCodeService, I_QRCODE_SERVICE } from '../../domain/ports/qrcode.service.interface';
import { TicketStatus } from '../../domain/ticket.entity';

export interface ValidateTicketResult {
  valid: boolean;
  status: 'VALID' | 'ALREADY_USED' | 'CANCELLED' | 'INVALID_SIGNATURE' | 'NOT_FOUND';
  ticketId?: string;
  eventName?: string;
  eventDate?: Date;
  categoryName?: string;
  attendeePhone?: string | null;
  usedAt?: Date;
  message: string;
}

@Injectable()
export class ValidateTicketUseCase {
  private readonly logger = new Logger(ValidateTicketUseCase.name);

  constructor(
    @Inject(I_TICKET_REPOSITORY) private readonly ticketRepository: ITicketRepository,
    @Inject(I_EVENT_REPOSITORY) private readonly eventRepository: IEventRepository,
    @Inject(I_QRCODE_SERVICE) private readonly qrCodeService: IQRCodeService,
  ) {}

  /**
   * Validate a ticket by its JWT hash (from QR code content)
   * @param hash The JWT string from the QR code
   * @param markAsUsed If true, marks the ticket as USED (default: true)
   */
  async execute(hash: string, markAsUsed: boolean = true): Promise<ValidateTicketResult> {
    // 1. Verify JWT Signature
    const ticketId = this.qrCodeService.verifySignedPayload(hash);
    if (!ticketId) {
      this.logger.warn(`Invalid signature for hash: ${hash.substring(0, 20)}...`);
      return {
        valid: false,
        status: 'INVALID_SIGNATURE',
        message: 'QR Code invalide (signature non reconnue)',
      };
    }

    // 2. Find ticket in database
    const ticket = await this.ticketRepository.findById(ticketId);
    if (!ticket) {
      this.logger.warn(`Ticket not found: ${ticketId}`);
      return {
        valid: false,
        status: 'NOT_FOUND',
        ticketId,
        message: 'Billet inconnu au système',
      };
    }

    // 3. Get event info
    const event = await this.eventRepository.findById(ticket.eventId);

    // 4. Check status
    if (ticket.status === TicketStatus.USED) {
      return {
        valid: false,
        status: 'ALREADY_USED',
        ticketId: ticket.id,
        eventName: event?.name,
        eventDate: event?.date,
        attendeePhone: ticket.attendeePhone,
        usedAt: ticket.usedAt ?? undefined,
        message: `Billet déjà utilisé${ticket.usedAt ? ` le ${ticket.usedAt.toLocaleString()}` : ''}`,
      };
    }

    if (ticket.status === TicketStatus.CANCELLED) {
      return {
        valid: false,
        status: 'CANCELLED',
        ticketId: ticket.id,
        eventName: event?.name,
        message: 'Billet annulé',
      };
    }

    // 5. Mark as used if requested
    if (markAsUsed) {
      ticket.use();
      await this.ticketRepository.save(ticket);
      this.logger.log(`Ticket ${ticket.id} validated and marked as USED`);
    }

    return {
      valid: true,
      status: 'VALID',
      ticketId: ticket.id,
      eventName: event?.name,
      eventDate: event?.date,
      attendeePhone: ticket.attendeePhone,
      message: 'Entrée validée',
    };
  }
}
