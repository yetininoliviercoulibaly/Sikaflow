import { EntitySchema } from '@mikro-orm/core';
import { OrganizationMember, UserRole } from '../../domain/organization-member.entity';

export const OrganizationMemberSchema = new EntitySchema<OrganizationMember>({
  class: OrganizationMember,
  tableName: 'organization_member',
  properties: {
    organizationId: { type: 'uuid', primary: true },
    userId: { type: 'uuid', primary: true },
    role: { type: 'enum', enum: true, items: () => UserRole },
    joinedAt: { type: 'timestamp' },
  },
});
