
import { Injectable } from '@nestjs/common';
import { EntityRepository } from '@mikro-orm/postgresql'; // or 'core' or 'knex' depending on driver, usually 'postgresql' or 'core'
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/core'; // core is safer
import { IEventRepository } from '../../domain/ports/event.repository.interface';
import { Event } from '../../domain/event.entity';
import { EventSchema } from './event.schema';

@Injectable()
export class MikroOrmEventRepository implements IEventRepository {
  private readonly repo: any; // Typing EntityRepository with Schema is tricky sometimes, using any/EntityRepository<Event>

  constructor(
    @InjectRepository(EventSchema)
    private readonly repository: any, // Using any to avoid strict typing issues with EntitySchema wrappers in this context
    private readonly em: EntityManager,
  ) {
    this.repo = repository;
  }

  async save(event: Event): Promise<void> {
    await this.em.persistAndFlush(event);
  }

  async findById(id: string): Promise<Event | null> {
    return this.repo.findOne({ id });
  }

  async findByOrganizationId(organizationId: string): Promise<Event[]> {
    return this.repo.find({ organizationId });
  }

  async findByNameILike(namePattern: string): Promise<Event[]> {
    return this.repo.find({ name: { $ilike: `%${namePattern}%` } });
  }

  async findEventsRequiringFeedback(beforeDate: Date): Promise<Event[]> {
    return this.repo.find({
      date: { $lt: beforeDate },
      feedbackSent: false,
    });
  }
}
