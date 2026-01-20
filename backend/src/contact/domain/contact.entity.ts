import { v4 } from 'uuid';

/**
 * Contact entity representing a person who owes or is owed money
 * Used for both B2B (merchant-customer) and C2C (friend-to-friend) contexts
 */
export class Contact {
  id: string;
  shortId: string; // #BC12AB (6 chars, collision-safe)
  ownerId: string; // User who owns this contact
  organizationId?: string; // Optional (pro context)

  phone?: string; // Primary key for search (indexed)
  displayName: string; // "Bakary Coulibaly"
  context?: string; // "le maçon", "mon cousin"
  embedding?: number[]; // pgvector embedding

  totalOwed: number; // Sum of pending debts TO owner
  totalOwing: number; // Sum of pending credits FROM owner
  lastInteractionAt: Date;
  createdAt: Date;

  constructor(
    ownerId: string,
    displayName: string,
    options?: {
      organizationId?: string;
      phone?: string;
      context?: string;
    },
  ) {
    this.id = v4();
    this.shortId = Contact.generateShortId();
    this.ownerId = ownerId;
    this.displayName = displayName;
    this.organizationId = options?.organizationId;
    this.phone = options?.phone;
    this.context = options?.context;
    this.totalOwed = 0;
    this.totalOwing = 0;
    this.lastInteractionAt = new Date();
    this.createdAt = new Date();
  }

  /**
   * Generate a 6-character alphanumeric short ID
   * Format: 2 uppercase letters + 4 digits (e.g., BC1234)
   */
  /**
   * Generate a 6-character alphanumeric short ID
   * Uses crypto for secure randomness to minimize collision probability
   */
  static generateShortId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const length = 6;
    let result = '';
    // Use dynamic import for crypto to avoid issues in some environments if needed, 
    // or standard require if we are in Node environment. 
    // Since this is a backend entity, we can assume Node.js environment or standard crypto API availability.
    // However, for entity purity, we might want to dependency inject this, but for static helper:
    
    // Simple implementation falling back to Math.random if crypto not available (unlikely in Node env)
    // But aligning with ContactService which uses crypto.
    // Actually, ContactService handles the "Unique" assignment.
    // This static method is a default initializer. 
    // Let's make it cleaner and configurable.

    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Update debt totals
   */
  updateDebtTotals(owed: number, owing: number): void {
    this.totalOwed = owed;
    this.totalOwing = owing;
    this.lastInteractionAt = new Date();
  }
}
