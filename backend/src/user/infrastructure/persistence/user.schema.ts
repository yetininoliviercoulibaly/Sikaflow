import { EntitySchema } from '@mikro-orm/core';
import { User } from '../../domain/user.entity';

export const UserSchema = new EntitySchema<User>({
  class: User,
  tableName: 'app_user',
  properties: {
    id: { type: 'uuid', primary: true },
    phoneNumber: { type: 'varchar', length: 50 },
    fullName: { type: 'string', nullable: true },
    lastActiveOrganizationId: { type: 'uuid', nullable: true },
    preferredLanguage: { type: 'string', default: 'fr' },
    createdAt: { type: 'datetime', defaultRaw: 'CURRENT_TIMESTAMP' },
    telegramUserId: { type: 'varchar', length: 50, nullable: true, unique: true },
  },
});
