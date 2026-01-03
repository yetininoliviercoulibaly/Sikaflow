import { EntitySchema } from '@mikro-orm/core';
import { User } from '../../domain/user.entity';

export const UserSchema = new EntitySchema<User>({
  class: User,
  tableName: 'app_user',
  properties: {
    id: { type: 'uuid', primary: true },
    phoneNumber: { type: 'varchar', length: 50 },
    fullName: { type: 'varchar', length: 100, nullable: true },
    lastActiveOrganizationId: { type: 'uuid', nullable: true },
    createdAt: { type: 'timestamp' },
  },
});
