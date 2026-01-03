import { EntitySchema } from '@mikro-orm/core';
import { EventPass, PassStatus } from '../../domain/event-pass.entity';

export const EventPassSchema = new EntitySchema<EventPass>({
  class: EventPass,
  tableName: 'event_pass',
  properties: {
    id: { type: 'uuid', primary: true },
    organizationId: { type: 'uuid' },
    validFrom: { type: 'timestamp' },
    validUntil: { type: 'timestamp' },
    status: { type: 'enum', enum: true, items: () => PassStatus },
    paymentReference: { type: 'varchar', nullable: true },
    createdAt: { type: 'timestamp' },
  },
});
