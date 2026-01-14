import { EntitySchema } from '@mikro-orm/core';
import { EventFeedback } from '../../domain/event-feedback.entity';

export const EventFeedbackSchema = new EntitySchema<EventFeedback>({
  class: EventFeedback,
  tableName: 'event_feedback',
  properties: {
    id: { type: 'uuid', primary: true },
    eventId: { type: 'uuid' },
    attendeePhone: { type: 'string' },
    rating: { type: 'integer' },
    comment: { type: 'text', nullable: true },
    createdAt: { type: 'timestamp' },
  },
  indexes: [
    { name: 'idx_feedback_event_phone', properties: ['eventId', 'attendeePhone'] },
  ],
});
