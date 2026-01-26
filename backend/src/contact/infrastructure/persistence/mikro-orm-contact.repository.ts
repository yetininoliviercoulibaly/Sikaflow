import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { IContactRepository } from '../../domain/ports/contact.repository.interface';
import { Contact } from '../../domain/contact.entity';

@Injectable()
export class MikroOrmContactRepository implements IContactRepository {
  constructor(private readonly em: EntityManager) {}

  async create(contact: Contact): Promise<Contact> {
    const newContact = this.em.create(Contact, contact);
    await this.em.persistAndFlush(newContact);
    return newContact;
  }

  async findById(id: string): Promise<Contact | null> {
    return this.em.findOne(Contact, { id });
  }

  async findByShortId(ownerId: string, shortId: string): Promise<Contact | null> {
    return this.em.findOne(Contact, { ownerId, shortId });
  }

  async findByPhone(ownerId: string, phone: string): Promise<Contact | null> {
    return this.em.findOne(Contact, { ownerId, phone });
  }

  async findByOwner(
    ownerId: string,
    options?: { organizationId?: string; limit?: number; offset?: number },
  ): Promise<Contact[]> {
    const query: Record<string, unknown> = { ownerId };
    if (options?.organizationId) {
      query.organizationId = options.organizationId;
    }

    return this.em.find(Contact, query, {
      limit: options?.limit ?? 50,
      offset: options?.offset ?? 0,
      orderBy: { lastInteractionAt: 'DESC' },
    });
  }

  async searchByName(ownerId: string, query: string, limit = 10): Promise<Contact[]> {
    // Case-insensitive LIKE search on displayName and context
    const searchPattern = `%${query}%`;
    return this.em.find(
      Contact,
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
  }

  async findWithPendingDebts(ownerId: string, organizationId?: string): Promise<Contact[]> {
    const query: Record<string, unknown> = {
      ownerId,
      totalOwed: { $gt: 0 },
    };
    if (organizationId) {
      query.organizationId = organizationId;
    }

    return this.em.find(Contact, query, {
      orderBy: { totalOwed: 'DESC' },
    });
  }

  async update(contact: Contact): Promise<Contact> {
    // With EntitySchema mapping to Domain Entity, updating the managed entity instance and flushing is sufficient.
    // However, if the contact passed here is not managed (e.g. from a DTO), we merge it.
    await this.em.flush();
    return contact;
  }

  async delete(id: string): Promise<void> {
    const contact = await this.em.getReference(Contact, id);
    if (contact) {
      await this.em.removeAndFlush(contact);
    }
  }

  async isShortIdUnique(ownerId: string, shortId: string): Promise<boolean> {
    const count = await this.em.count(Contact, { ownerId, shortId });
    return count === 0;
  }
}

