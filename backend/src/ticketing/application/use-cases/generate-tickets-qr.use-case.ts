import { Injectable, Inject, Logger } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { IEventRepository, I_EVENT_REPOSITORY } from '../../domain/ports/event.repository.interface';
import { ITicketRepository, I_TICKET_REPOSITORY } from '../../domain/ports/ticket.repository.interface';
import { ITicketCategoryRepository, I_TICKET_CATEGORY_REPOSITORY } from '../../domain/ports/ticket-category.repository.interface';
import { IQRCodeService, I_QRCODE_SERVICE } from '../../domain/ports/qrcode.service.interface';
import { Ticket, TicketStatus } from '../../domain/ticket.entity';
import { TicketCategory } from '../../domain/ticket-category.entity';
import { v4 as uuidv4 } from 'uuid';

export interface GeneratedTicket {
  id: string;
  qrBuffer: Buffer;
  secureHash: string;
  categoryName: string;
}

export interface GenerateTicketsQRResult {
  eventName: string;
  categoryName: string;
  tickets: GeneratedTicket[];
}

@Injectable()
export class GenerateTicketsQRUseCase {
  private readonly logger = new Logger(GenerateTicketsQRUseCase.name);

  constructor(
    @Inject(I_EVENT_REPOSITORY) private readonly eventRepository: IEventRepository,
    @Inject(I_TICKET_REPOSITORY) private readonly ticketRepository: ITicketRepository,
    @Inject(I_TICKET_CATEGORY_REPOSITORY) private readonly categoryRepository: ITicketCategoryRepository,
    @Inject(I_QRCODE_SERVICE) private readonly qrCodeService: IQRCodeService,
    private readonly em: EntityManager,
  ) {}

  /**
   * Generates N tickets for an event with QR codes.
   * No messaging service required - returns QR buffers for the caller to distribute.
   */
  async execute(
    eventId: string,
    quantity: number,
    categoryId?: string,
  ): Promise<GenerateTicketsQRResult> {
    return await this.em.transactional(async () => {
      // 1. Fetch Event
      const event = await this.eventRepository.findById(eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      // 2. Resolve Category (use default if not specified)
      let category: TicketCategory | null = null;
      if (categoryId) {
        category = await this.categoryRepository.findById(categoryId);
        if (!category) {
          throw new Error('Category not found');
        }
      } else {
        // Get default category or first available
        category = await this.categoryRepository.findDefaultByEventId(eventId);
        if (!category) {
          const categories = await this.categoryRepository.findByEventId(eventId);
          if (categories.length > 0) {
            category = categories[0];
          }
        }
      }

      // 3. Inventory Check on Category (or Event for legacy)
      if (category) {
        if (!category.canSell(quantity)) {
          throw new Error(`Not enough capacity for category '${category.name}'. Remaining: ${category.getRemainingCapacity()}`);
        }
        category.incrementSold(quantity);
        await this.categoryRepository.update(category);
      } else {
        // Legacy: use event-level capacity
        if (!event.canSell(quantity)) {
          throw new Error(`Event '${event.name}' is sold out. Remaining: ${event.getRemainingCapacity()}`);
        }
        event.incrementSold(quantity);
        await this.eventRepository.save(event);
      }

      // 4. Generate N Tickets with QR Codes
      const generatedTickets: GeneratedTicket[] = [];

      for (let i = 0; i < quantity; i++) {
        const ticketId = uuidv4();
        const signedPayload = this.qrCodeService.generateSignedPayload(ticketId);

        const ticket = new Ticket(
          ticketId,
          eventId,
          null, // Anonymous ticket - no phone assigned yet
          TicketStatus.VALID,
          signedPayload,
          new Date(),
          undefined,
          category?.id,
        );

        await this.ticketRepository.save(ticket);

        const qrBuffer = await this.qrCodeService.generateQRCode(signedPayload);

        generatedTickets.push({
          id: ticketId,
          qrBuffer,
          secureHash: signedPayload,
          categoryName: category?.name || 'Standard',
        });
      }

      this.logger.log(`Generated ${quantity} tickets for event '${event.name}' (Category: ${category?.name || 'Default'})`);

      return {
        eventName: event.name,
        categoryName: category?.name || 'Standard',
        tickets: generatedTickets,
      };
    });
  }
}
