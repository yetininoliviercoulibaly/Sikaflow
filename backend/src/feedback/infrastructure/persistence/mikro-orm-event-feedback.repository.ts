import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { IEventFeedbackRepository } from '../../domain/ports/event-feedback.repository.interface';
import { EventFeedback } from '../../domain/event-feedback.entity';
import { EventFeedbackSchema } from '../persistence/event-feedback.schema';

@Injectable()
export class MikroOrmEventFeedbackRepository implements IEventFeedbackRepository {
  constructor(private readonly em: EntityManager) {}

  async create(feedback: EventFeedback): Promise<void> {
    this.em.persist(feedback);
    await this.em.flush();
  }

  async findByEventId(eventId: string): Promise<EventFeedback[]> {
    return this.em.find(EventFeedbackSchema, { eventId });
  }

  async findByUserAndEvent(attendeePhone: string, eventId: string): Promise<EventFeedback | null> {
    return this.em.findOne(EventFeedbackSchema, { attendeePhone, eventId });
  }
}
