import { EventPass, PassStatus } from '../event-pass.entity';

export interface IEventPassRepository {
  findActiveForOrganization(organizationId: string): Promise<EventPass | null>;
  findById(id: string): Promise<EventPass | null>;
  create(pass: EventPass): Promise<EventPass>;
  updateStatus(id: string, status: PassStatus): Promise<void>;
}

export const I_EVENT_PASS_REPOSITORY = Symbol('I_EVENT_PASS_REPOSITORY');
