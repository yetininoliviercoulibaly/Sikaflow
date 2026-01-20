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

  totalOwed: number; // Sum of pending debts TO owner
  totalOwing: number; // Sum of pending credits FROM owner
  embedding?: number[]; // Vector embedding for semantic search
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
  static generateShortId(): string {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';
    
    let shortId = '';
    shortId += letters.charAt(Math.floor(Math.random() * letters.length));
    shortId += letters.charAt(Math.floor(Math.random() * letters.length));
    for (let i = 0; i < 4; i++) {
      shortId += digits.charAt(Math.floor(Math.random() * digits.length));
    }
    return shortId;
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
