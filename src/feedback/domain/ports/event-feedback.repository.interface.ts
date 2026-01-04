import { EventFeedback } from '../../domain/event-feedback.entity';

export interface IEventFeedbackRepository {
  create(feedback: EventFeedback): Promise<void>;
  findByEventId(eventId: string): Promise<EventFeedback[]>;
  findByUserAndEvent(userId: string, eventId: string): Promise<EventFeedback | null>;
}

export const I_EVENT_FEEDBACK_REPOSITORY = 'I_EVENT_FEEDBACK_REPOSITORY';
