import { EntitySchema } from '@mikro-orm/core';
import { Incident, IncidentSeverity, IncidentStatus } from '../../domain/incident.entity';

export const IncidentSchema = new EntitySchema<Incident>({
  class: Incident,
  tableName: 'incident',
  properties: {
    id: { type: 'uuid', primary: true },
    organizationId: { type: 'uuid' },
    reportedByUserId: { type: 'uuid', nullable: true },
    originMessageId: { type: 'uuid', nullable: true },
    severity: { type: 'enum', enum: true, items: () => IncidentSeverity },
    description: { type: 'text', nullable: true },
    status: { type: 'enum', enum: true, items: () => IncidentStatus },
    occurredAt: { type: 'timestamp' },
    createdAt: { type: 'timestamp' },
  },
});
