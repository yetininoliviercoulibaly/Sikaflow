
import { EntitySchema } from '@mikro-orm/core';
import { TicketClaim, TicketClaimStatus } from '../../domain/ticket-claim.entity';

export const TicketClaimSchema = new EntitySchema<TicketClaim>({
  class: TicketClaim,
  properties: {
    id: { type: 'uuid', primary: true },
    eventId: { type: 'uuid' },
    token: { type: 'string', unique: true },
    status: { type: 'enum', items: Object.values(TicketClaimStatus), default: TicketClaimStatus.PENDING },
    createdBy: { type: 'string' },
    claimedBy: { type: 'string', nullable: true },
    claimedAt: { type: 'datetime', nullable: true },
    createdAt: { type: 'datetime' },
  },
});
