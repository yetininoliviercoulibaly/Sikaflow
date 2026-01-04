
import { EntitySchema } from '@mikro-orm/core';
import { Event } from '../../domain/event.entity';

export const EventSchema = new EntitySchema<Event>({
  class: Event,
  tableName: 'event',
  properties: {
    id: { type: 'uuid', primary: true },
    organizationId: { type: 'uuid' },
    name: { type: 'varchar', length: 255 },
    date: { type: 'timestamp' },
    totalCapacity: { type: 'integer' },
    price: { type: 'integer' },
    soldCount: { type: 'integer', default: 0 },
    feedbackSent: { type: 'boolean', default: false },
    createdAt: { type: 'timestamp' },
  },
});
