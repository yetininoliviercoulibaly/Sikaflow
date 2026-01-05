
import { EntitySchema } from '@mikro-orm/core';
import { Ticket, TicketStatus } from '../../domain/ticket.entity';

export const TicketSchema = new EntitySchema<Ticket>({
  class: Ticket,
  tableName: 'ticket',
  properties: {
    id: { type: 'uuid', primary: true },
    eventId: { type: 'uuid' },
    attendeePhone: { type: 'varchar', length: 20 },
    status: { type: 'enum', items: Object.values(TicketStatus), default: TicketStatus.VALID },
    secureHash: { type: 'text' },
    createdAt: { type: 'timestamp' },
    usedAt: { type: 'timestamp', nullable: true },
  },
  indexes: [
    { properties: ['eventId'] },
    { properties: ['attendeePhone'] },
  ],
});
