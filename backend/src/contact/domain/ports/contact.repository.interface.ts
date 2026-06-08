import { Contact } from '../contact.entity';

export interface IContactRepository {
  /**
   * Create a new contact
   */
  create(contact: Contact): Promise<Contact>;

  /**
   * Find contact by ID
   */
  findById(id: string): Promise<Contact | null>;

  /**
   * Find contact by shortId for a specific owner
   */
  findByShortId(ownerId: string, shortId: string): Promise<Contact | null>;

  /**
   * Find contact by phone for a specific owner (optionally scoped to an organization)
   */
  findByPhone(ownerId: string, phone: string, organizationId?: string): Promise<Contact | null>;

  /**
   * Find all contacts for an owner with optional organization filter
   */
  findByOwner(
    ownerId: string,
    options?: {
      organizationId?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<Contact[]>;

  /**
   * Search contacts by name (fuzzy search), optionally scoped to an organization
   */
  searchByName(ownerId: string, query: string, limit?: number, organizationId?: string): Promise<Contact[]>;

  /**
   * Find contacts with pending debts (totalOwed > 0)
   */
  findWithPendingDebts(ownerId: string, organizationId?: string): Promise<Contact[]>;

  /**
   * Update a contact
   */
  update(contact: Contact): Promise<Contact>;

  /**
   * Delete a contact
   */
  delete(id: string): Promise<void>;

  /**
   * Check if shortId is unique for owner
   */
  isShortIdUnique(ownerId: string, shortId: string): Promise<boolean>;
}

export const I_CONTACT_REPOSITORY = Symbol('IContactRepository');
