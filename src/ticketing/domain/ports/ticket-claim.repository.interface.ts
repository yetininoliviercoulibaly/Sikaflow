
import { TicketClaim } from '../ticket-claim.entity';

export interface ITicketClaimRepository {
  save(claim: TicketClaim): Promise<void>;
  findByToken(token: string): Promise<TicketClaim | null>;
  findByEventId(eventId: string): Promise<TicketClaim[]>;
}

export const I_TICKET_CLAIM_REPOSITORY = 'I_TICKET_CLAIM_REPOSITORY';
