
import { Ticket } from '../ticket.entity';

export const I_TICKET_REPOSITORY = 'I_TICKET_REPOSITORY';

export interface ITicketRepository {
  save(ticket: Ticket): Promise<void>;
  findById(id: string): Promise<Ticket | null>;
  findByEventId(eventId: string): Promise<Ticket[]>;
  findByEventIds(eventIds: string[]): Promise<Ticket[]>;
  findByToken(token: string): Promise<Ticket | null>;
  findLastTicketForPhone(phone: string): Promise<Ticket | null>;
}
