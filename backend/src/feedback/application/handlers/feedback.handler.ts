
import { Injectable, Inject, Logger } from '@nestjs/common';
import { IActionHandler, ActionContext } from '../../../webhook/application/handlers/action-handler.interface'; 
import { IEventFeedbackRepository, I_EVENT_FEEDBACK_REPOSITORY } from '../../domain/ports/event-feedback.repository.interface';
import { ITicketRepository, I_TICKET_REPOSITORY } from '../../../ticketing/domain/ports/ticket.repository.interface';
import { EventFeedback } from '../../domain/event-feedback.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FeedbackHandler implements IActionHandler {
  private readonly logger = new Logger(FeedbackHandler.name);

  constructor(
    @Inject(I_EVENT_FEEDBACK_REPOSITORY) private readonly feedbackRepository: IEventFeedbackRepository,
    @Inject(I_TICKET_REPOSITORY) private readonly ticketRepository: ITicketRepository,
  ) {}

  canHandle(intent: string): boolean {
    return intent === 'PROVIDE_FEEDBACK';
  }

  async handle(data: any, context: ActionContext): Promise<void> {
    const { senderPhoneNumber, language, messagingService } = context;
    const isEn = language === 'en';

    // Data should contain 'rating'
    const rating = data.rating;
    const comment = data.comment;

    if (!rating) {
        // Fallback if LLM missed it but intent is feedback
        await messagingService.sendMessage(senderPhoneNumber, isEn
            ? "❓ Could you specify a rating between 1 and 5?"
            : "❓ Pouvez-vous préciser une note entre 1 et 5 ?");
        return;
    }

    const eventId = await this.findLastEventId(senderPhoneNumber);

    if (!eventId) {
        await messagingService.sendMessage(senderPhoneNumber, isEn
            ? "❌ I can't find the event you are rating."
            : "❌ Je ne trouve pas l'événement concerné par votre note.");
        return;
    }
    
    const feedback = new EventFeedback(
        uuidv4(),
        eventId,
        senderPhoneNumber, 
        rating,
        comment || null,
        new Date()
    );

    await this.feedbackRepository.create(feedback);

    await messagingService.sendMessage(senderPhoneNumber, isEn
        ? `✅ Thank you! You rated it ${rating}/5.`
        : `✅ Merci ! C'est noté ${rating}/5.`);
  }

  private async findLastEventId(phone: string): Promise<string | null> {
      const ticket = await this.ticketRepository.findLastTicketForPhone(phone);
      if (ticket) {
          return ticket.eventId;
      }
      return null; 
  }
}
