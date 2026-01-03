import { EntitySchema } from '@mikro-orm/core';
import { Organization } from '../../domain/organization.entity';

export const OrganizationSchema = new EntitySchema<Organization>({
  class: Organization,
  tableName: 'organization', // Singular as requested
  properties: {
    id: { type: 'uuid', primary: true },
    name: { type: 'varchar', length: 100 },
    ownerId: { type: 'uuid' }, // Assuming simple column mapping for now. Relations handled via proper referencing if needed or just ID.
    settings: { type: 'jsonb' },
    createdAt: { type: 'timestamp' },
  },
});
