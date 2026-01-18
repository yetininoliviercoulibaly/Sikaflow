import { TicketCategory } from '../ticket-category.entity';

export const I_TICKET_CATEGORY_REPOSITORY = Symbol('ITicketCategoryRepository');

export interface ITicketCategoryRepository {
  findById(id: string): Promise<TicketCategory | null>;
  findByEventId(eventId: string): Promise<TicketCategory[]>;
  findDefaultByEventId(eventId: string): Promise<TicketCategory | null>;
  save(category: TicketCategory): Promise<void>;
  update(category: TicketCategory): Promise<void>;
  delete(id: string): Promise<void>;
}
