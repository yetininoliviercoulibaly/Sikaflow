import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { IContactRepository } from '../../domain/ports/contact.repository.interface';
import { Contact } from '../../domain/contact.entity';
import { ContactOrmEntity } from './contact.orm-entity';

@Injectable()
export class MikroOrmContactRepository implements IContactRepository {
  constructor(private readonly em: EntityManager) {}

  async create(contact: Contact): Promise<Contact> {
    const ormEntity = this.toOrmEntity(contact);
    await this.em.persistAndFlush(ormEntity);
    return contact;
  }

  async findById(id: string): Promise<Contact | null> {
    const ormEntity = await this.em.findOne(ContactOrmEntity, { id });
    return ormEntity ? this.toDomainEntity(ormEntity) : null;
  }

  async findByShortId(ownerId: string, shortId: string): Promise<Contact | null> {
    const ormEntity = await this.em.findOne(ContactOrmEntity, { ownerId, shortId });
    return ormEntity ? this.toDomainEntity(ormEntity) : null;
  }

  async findByPhone(ownerId: string, phone: string): Promise<Contact | null> {
    const ormEntity = await this.em.findOne(ContactOrmEntity, { ownerId, phone });
    return ormEntity ? this.toDomainEntity(ormEntity) : null;
  }

  async findByOwner(
    ownerId: string,
    options?: { organizationId?: string; limit?: number; offset?: number },
  ): Promise<Contact[]> {
    const query: Record<string, unknown> = { ownerId };
    if (options?.organizationId) {
      query.organizationId = options.organizationId;
    }

    const ormEntities = await this.em.find(ContactOrmEntity, query, {
      limit: options?.limit ?? 50,
      offset: options?.offset ?? 0,
      orderBy: { lastInteractionAt: 'DESC' },
    });

    return ormEntities.map((e) => this.toDomainEntity(e));
  }

  async searchByName(ownerId: string, query: string, limit = 10): Promise<Contact[]> {
    // Case-insensitive LIKE search on displayName and context
    const searchPattern = `%${query}%`;
    const ormEntities = await this.em.find(
      ContactOrmEntity,
      {
        ownerId,
        $or: [
          { displayName: { $ilike: searchPattern } },
          { context: { $ilike: searchPattern } },
        ],
      },
      {
        orderBy: { lastInteractionAt: 'DESC' },
        limit,
      },
    );

    return ormEntities.map((e) => this.toDomainEntity(e));
  }

  async findWithPendingDebts(ownerId: string, organizationId?: string): Promise<Contact[]> {
    const query: Record<string, unknown> = {
      ownerId,
      totalOwed: { $gt: 0 },
    };
    if (organizationId) {
      query.organizationId = organizationId;
    }

    const ormEntities = await this.em.find(ContactOrmEntity, query, {
      orderBy: { totalOwed: 'DESC' },
    });

    return ormEntities.map((e) => this.toDomainEntity(e));
  }

  async update(contact: Contact): Promise<Contact> {
    const ormEntity = await this.em.findOneOrFail(ContactOrmEntity, { id: contact.id });
    
    ormEntity.displayName = contact.displayName;
    ormEntity.context = contact.context;
    ormEntity.phone = contact.phone;
    ormEntity.totalOwed = contact.totalOwed;
    ormEntity.totalOwing = contact.totalOwing;
    ormEntity.lastInteractionAt = contact.lastInteractionAt;

    await this.em.flush();
    return contact;
  }

  async updateBalances(id: string, deltaOwed: number, deltaOwing: number): Promise<Contact> {
    // We use a custom query to perform atomic update
    // Note: MikroORM doesn't support increment directly via entity, so we use QueryBuilder or native query.
    // However, to return the updated entity, we can use QB with RETURNING.

    const qb = this.em.createQueryBuilder(ContactOrmEntity);

    await qb.update({
        totalOwed: qb.raw(`total_owed + ${deltaOwed}`),
        totalOwing: qb.raw(`total_owing + ${deltaOwing}`),
        lastInteractionAt: new Date(),
      })
      .where({ id })
      .execute();

    // Fetch fresh entity
    const updated = await this.findById(id);
    if (!updated) throw new Error('Contact not found after update');
    return updated;
  }

  async delete(id: string): Promise<void> {
    const ormEntity = await this.em.findOne(ContactOrmEntity, { id });
    if (ormEntity) {
      await this.em.removeAndFlush(ormEntity);
    }
  }

  async isShortIdUnique(ownerId: string, shortId: string): Promise<boolean> {
    const count = await this.em.count(ContactOrmEntity, { ownerId, shortId });
    return count === 0;
  }

  private toOrmEntity(contact: Contact): ContactOrmEntity {
    const ormEntity = new ContactOrmEntity();
    ormEntity.id = contact.id;
    ormEntity.shortId = contact.shortId;
    ormEntity.ownerId = contact.ownerId;
    ormEntity.organizationId = contact.organizationId;
    ormEntity.phone = contact.phone;
    ormEntity.displayName = contact.displayName;
    ormEntity.context = contact.context;
    ormEntity.totalOwed = contact.totalOwed;
    ormEntity.totalOwing = contact.totalOwing;
    ormEntity.embedding = contact.embedding;
    ormEntity.lastInteractionAt = contact.lastInteractionAt;
    ormEntity.createdAt = contact.createdAt;
    return ormEntity;
  }

  private toDomainEntity(ormEntity: ContactOrmEntity): Contact {
    const contact = new Contact(ormEntity.ownerId, ormEntity.displayName, {
      organizationId: ormEntity.organizationId,
      phone: ormEntity.phone,
      context: ormEntity.context,
    });
    
    // Override auto-generated values with persisted ones
    contact.id = ormEntity.id;
    contact.shortId = ormEntity.shortId;
    contact.totalOwed = Number(ormEntity.totalOwed);
    contact.totalOwing = Number(ormEntity.totalOwing);
    contact.embedding = ormEntity.embedding;
    contact.lastInteractionAt = ormEntity.lastInteractionAt;
    contact.createdAt = ormEntity.createdAt;
    
    return contact;
  }
}
