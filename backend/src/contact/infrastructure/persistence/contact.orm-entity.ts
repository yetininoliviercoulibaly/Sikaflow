import { Entity, PrimaryKey, Property, Index, Unique } from '@mikro-orm/core';

/**
 * MikroORM entity for Contact persistence
 * Separated from domain entity per hexagonal architecture rules
 */
@Entity({ tableName: 'contact' })
@Unique({ properties: ['ownerId', 'shortId'] })
export class ContactOrmEntity {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @Property({ length: 6 })
  @Index()
  shortId!: string;

  @Property({ type: 'uuid' })
  @Index()
  ownerId!: string;

  @Property({ type: 'uuid', nullable: true })
  @Index()
  organizationId?: string;

  @Property({ length: 20, nullable: true })
  @Index()
  phone?: string;

  @Property({ length: 255 })
  displayName!: string;

  @Property({ length: 255, nullable: true })
  context?: string;

  @Property({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalOwed!: number;

  @Property({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalOwing!: number;

  @Property({ type: 'timestamptz' })
  lastInteractionAt!: Date;

  @Property({ type: 'timestamptz' })
  createdAt!: Date;
}
