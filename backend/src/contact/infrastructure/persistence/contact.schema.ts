import { EntitySchema } from '@mikro-orm/core';
import { Contact } from '../../domain/contact.entity';

export const ContactSchema = new EntitySchema<Contact>({
  class: Contact,
  tableName: 'contact',
  properties: {
    id: { type: 'uuid', primary: true },
    shortId: { type: 'string', length: 6 },
    ownerId: { type: 'uuid' },
    organizationId: { type: 'uuid', nullable: true },
    phone: { type: 'string', length: 20, nullable: true },
    displayName: { type: 'string', length: 255 },
    context: { type: 'string', length: 255, nullable: true },
    embedding: { type: 'vector', length: 384, nullable: true },
    totalOwed: { type: 'decimal', precision: 12, scale: 2, default: 0 },
    totalOwing: { type: 'decimal', precision: 12, scale: 2, default: 0 },
    lastInteractionAt: { type: 'timestamptz' },
    createdAt: { type: 'timestamptz' },
  },
  indexes: [
    { properties: ['ownerId'] },
    { properties: ['shortId'] },
    { properties: ['organizationId'] },
    { properties: ['ownerId', 'phone'] },
  ],
  uniques: [
    { properties: ['ownerId', 'shortId'] },
  ],
});
