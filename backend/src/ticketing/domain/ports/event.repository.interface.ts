
import { Event } from '../event.entity';

export const I_EVENT_REPOSITORY = 'I_EVENT_REPOSITORY';

export interface IEventRepository {
  save(event: Event): Promise<void>;
  findById(id: string): Promise<Event | null>;
  findByOrganizationId(organizationId: string): Promise<Event[]>;
  findByNameILike(namePattern: string): Promise<Event[]>;
  findEventsRequiringFeedback(beforeDate: Date): Promise<Event[]>;
}
