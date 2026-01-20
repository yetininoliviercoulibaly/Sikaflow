import { EntitySchema } from '@mikro-orm/core';
import { Report, ReportType } from '../../domain/report.entity';
import { Organization } from '../../../organization/domain/organization.entity';

export const ReportSchema = new EntitySchema<Report>({
  class: Report,
  tableName: 'report',
  properties: {
    id: { type: 'uuid', primary: true },
    organization: { kind: 'm:1', entity: () => Organization },
    type: { type: 'enum', enum: true, items: () => ReportType },
    periodStart: { type: 'timestamp', nullable: true },
    periodEnd: { type: 'timestamp', nullable: true },
    data: { type: 'jsonb' },
    generatedAt: { type: 'timestamp', onCreate: () => new Date() },
  },
});
