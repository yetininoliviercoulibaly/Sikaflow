import { Injectable, Inject, Logger } from '@nestjs/common';
import { IEventRepository, I_EVENT_REPOSITORY } from '../../../ticketing/domain/ports/event.repository.interface';
import { ITicketRepository, I_TICKET_REPOSITORY } from '../../../ticketing/domain/ports/ticket.repository.interface';
import { IWhatsAppService, I_WHATSAPP_SERVICE } from '../../../common/whatsapp/whatsapp.service.interface';

@Injectable()
export class SendFeedbackRequestsUseCase {
  private readonly logger = new Logger(SendFeedbackRequestsUseCase.name);

  constructor(
    @Inject(I_EVENT_REPOSITORY) private readonly eventRepository: IEventRepository,
    @Inject(I_TICKET_REPOSITORY) private readonly ticketRepository: ITicketRepository,
    @Inject(I_WHATSAPP_SERVICE) private readonly whatsAppService: IWhatsAppService,
  ) {}

  async execute(): Promise<void> {
    // 1. Identify events finished > 24h ago and not yet processed
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const events = await this.eventRepository.findEventsRequiringFeedback(oneDayAgo);

    if (events.length === 0) {
      this.logger.log('No events require feedback at this time.');
      return;
    }

    this.logger.log(`Found ${events.length} events needing feedback requests.`);

    const eventIds = events.map(e => e.id);
    const allTickets = await this.ticketRepository.findByEventIds(eventIds);

    // Group tickets by event for efficient lookup
    const ticketsByEvent = allTickets.reduce<Record<string, typeof allTickets>>((acc, ticket) => {
      if (!acc[ticket.eventId]) {
        acc[ticket.eventId] = [];
      }
      acc[ticket.eventId].push(ticket);
      return acc;
    }, {});

    for (const event of events) {
      try {
        const eventTickets = ticketsByEvent[event.id] || [];
        const uniquePhones = new Set<string>();
        eventTickets.forEach(t => {
          if (t.attendeePhone) uniquePhones.add(t.attendeePhone);
        });

        this.logger.log(`Event ${event.name}: Found ${uniquePhones.size} unique attendees.`);

        for (const phone of uniquePhones) {
          // Send Interactive Message (List for 1-5 Rating)
          await this.whatsAppService.sendInteractiveList(
            phone,
            'Votre Avis',
            `Comment avez-vous trouvé *${event.name}* ?`,
            'Noter',
            [{
              title: 'Note sur 5',
              rows: [
                { id: 'FEEDBACK|5', title: '⭐⭐⭐⭐⭐ (5/5)', description: 'Génial !' },
                { id: 'FEEDBACK|4', title: '⭐⭐⭐⭐ (4/5)', description: 'Très bien' },
                { id: 'FEEDBACK|3', title: '⭐⭐⭐ (3/5)', description: 'Bien' },
                { id: 'FEEDBACK|2', title: '⭐⭐ (2/5)', description: 'Moyen' },
                { id: 'FEEDBACK|1', title: '⭐ (1/5)', description: 'Décevant' }
              ]
            }]
          );
        }

        // 3. Mark Event as Processed
        event.feedbackSent = true;
        await this.eventRepository.save(event);

        this.logger.log(`Feedback requests sent for event ${event.name} to ${uniquePhones.size} attendees.`);

      } catch (e) {
        this.logger.error(`Failed to process feedback for event ${event.id}: ${e.message}`);
      }
    }
  }
}
