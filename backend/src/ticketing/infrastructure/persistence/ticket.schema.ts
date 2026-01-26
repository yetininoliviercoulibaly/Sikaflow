
import { EntitySchema } from '@mikro-orm/core';
import { Ticket, TicketStatus } from '../../domain/ticket.entity';

export const TicketSchema = new EntitySchema<Ticket>({
  class: Ticket,
  tableName: 'ticket',
  properties: {
    id: { type: 'uuid', primary: true },
    eventId: { type: 'uuid', fieldName: 'event_id' },
    categoryId: { type: 'uuid', fieldName: 'category_id', nullable: true },
    attendeePhone: { type: 'varchar', fieldName: 'attendee_phone', length: 50, nullable: true },
    status: { type: 'enum', items: Object.values(TicketStatus), default: TicketStatus.VALID },
    secureHash: { type: 'text', fieldName: 'secure_hash' },
    createdAt: { type: 'timestamp', fieldName: 'created_at' },
    usedAt: { type: 'timestamp', fieldName: 'used_at', nullable: true },
  },
  indexes: [
    { properties: ['eventId'] },
    { properties: ['categoryId'] },
    { properties: ['attendeePhone'] },
  ],
});

