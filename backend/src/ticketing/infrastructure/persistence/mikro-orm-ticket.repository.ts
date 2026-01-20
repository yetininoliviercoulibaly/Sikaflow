
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/core';
import { ITicketRepository } from '../../domain/ports/ticket.repository.interface';
import { Ticket, TicketStatus } from '../../domain/ticket.entity';
import { TicketSchema } from './ticket.schema';

@Injectable()
export class MikroOrmTicketRepository implements ITicketRepository {
  constructor(
    @InjectRepository(TicketSchema)
    private readonly repo: any,
    private readonly em: EntityManager,
  ) {}

  async save(ticket: Ticket): Promise<void> {
    await this.em.persistAndFlush(ticket);
  }

  async findById(id: string): Promise<Ticket | null> {
    return this.repo.findOne({ id });
  }

  async findByEventId(eventId: string): Promise<Ticket[]> {
    return this.repo.find({ eventId });
  }

  async findByEventIds(eventIds: string[]): Promise<Ticket[]> {
    return this.repo.find({ eventId: { $in: eventIds } });
  }

  async findByToken(token: string): Promise<Ticket | null> {
    return this.repo.findOne({ token });
  }

  async findLastTicketForPhone(phone: string): Promise<Ticket | null> {
      const tickets = await this.repo.find(
          { 
            attendeePhone: phone,
            status: { $in: [TicketStatus.USED, TicketStatus.VALID] }
          }, 
          { 
              orderBy: { usedAt: 'DESC', createdAt: 'DESC' }, 
              limit: 1 
          }
      );
      return tickets.length > 0 ? tickets[0] : null;
  }
}
