import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { ITicketCategoryRepository } from '../../domain/ports/ticket-category.repository.interface';
import { TicketCategory } from '../../domain/ticket-category.entity';

@Injectable()
export class MikroOrmTicketCategoryRepository implements ITicketCategoryRepository {
  constructor(private readonly em: EntityManager) {}

  async findById(id: string): Promise<TicketCategory | null> {
    return this.em.findOne(TicketCategory, { id });
  }

  async findByEventId(eventId: string): Promise<TicketCategory[]> {
    return this.em.find(TicketCategory, { eventId });
  }

  async findDefaultByEventId(eventId: string): Promise<TicketCategory | null> {
    return this.em.findOne(TicketCategory, { eventId, isDefault: true });
  }

  async save(category: TicketCategory): Promise<void> {
    this.em.persist(category);
    await this.em.flush();
  }

  async update(category: TicketCategory): Promise<void> {
    await this.em.flush();
  }

  async delete(id: string): Promise<void> {
    const category = await this.findById(id);
    if (category) {
      this.em.remove(category);
      await this.em.flush();
    }
  }
}
