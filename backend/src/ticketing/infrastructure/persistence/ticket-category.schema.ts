import { EntitySchema } from '@mikro-orm/core';
import { TicketCategory } from '../../domain/ticket-category.entity';

export const TicketCategorySchema = new EntitySchema<TicketCategory>({
  class: TicketCategory,
  tableName: 'ticket_category',
  properties: {
    id: { type: 'uuid', primary: true },
    eventId: { type: 'uuid', fieldName: 'event_id' },
    name: { type: 'string', length: 100 },
    price: { type: 'integer' },
    capacity: { type: 'integer' },
    soldCount: { type: 'integer', fieldName: 'sold_count', default: 0 },
    isDefault: { type: 'boolean', fieldName: 'is_default', default: false },
    benefits: { type: 'array', default: [] },
    createdAt: { type: 'datetime', fieldName: 'created_at', onCreate: () => new Date() },
  },
});
