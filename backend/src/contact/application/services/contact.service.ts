import { Injectable, Inject, Logger } from '@nestjs/common';
import { IContactRepository, I_CONTACT_REPOSITORY } from '../../domain/ports/contact.repository.interface';
import { ITransactionRepository, I_TRANSACTION_REPOSITORY } from '../../../transaction/domain/ports/transaction.repository.interface';
import { Contact } from '../../domain/contact.entity';
import { Transaction, TransactionType, TransactionStatus } from '../../../transaction/domain/transaction.entity';
import { v4 } from 'uuid';
import * as crypto from 'crypto';
import { getCurrency } from '../../../common/utils/currency.util';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    @Inject(I_CONTACT_REPOSITORY)
    private readonly contactRepository: IContactRepository,
    @Inject(I_TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
  ) {}

  /**
   * Add a debt (money owed TO the user)
   */
  async addDebt(
    userId: string,
    organizationId: string | undefined,
    data: {
      amount: number;
      contactName: string;
      contactPhone?: string;
      contactContext?: string;
      currency?: string;
    },
  ): Promise<Contact> {
    // Validate amount
    if (!data.amount || data.amount <= 0 || !Number.isFinite(data.amount)) {
      throw new Error('Invalid amount: must be a positive number');
    }

    const contact = await this.findOrCreateContact(userId, organizationId, data);

    // Update Totals (Pessimistic locking would be ideal here, but for MVP we assume low race condition prob per user)
    // TODO: Add Optimistic Locking via Version if scaling
    contact.totalOwed = (Number(contact.totalOwed) || 0) + data.amount;
    contact.lastInteractionAt = new Date();
    await this.contactRepository.update(contact);

    // Audit Trail
    await this.createTransaction(
      userId,
      organizationId,
      contact.id,
      TransactionType.DEBT,
      data.amount,
      data.currency || getCurrency(),
      `Créance pour ${contact.displayName}`,
    );

    return contact;
  }

  /**
   * Add a credit (money the user OWES)
   */
  async addCredit(
    userId: string,
    organizationId: string | undefined,
    data: {
      amount: number;
      contactName: string;
      contactPhone?: string;
      contactContext?: string;
      currency?: string;
    },
  ): Promise<Contact> {
    // Validate amount
    if (!data.amount || data.amount <= 0 || !Number.isFinite(data.amount)) {
      throw new Error('Invalid amount: must be a positive number');
    }

    const contact = await this.findOrCreateContact(userId, organizationId, data);

    contact.totalOwing = (Number(contact.totalOwing) || 0) + data.amount;
    contact.lastInteractionAt = new Date();
    await this.contactRepository.update(contact);

    // Audit Trail
    await this.createTransaction(
      userId,
      organizationId,
      contact.id,
      TransactionType.CREDIT,
      data.amount,
      data.currency || getCurrency(),
      `Dette envers ${contact.displayName}`,
    );

    return contact;
  }

  /**
   * Settle a debt (User gets paid back)
   */
  async settleDebt(
    userId: string,
    organizationId: string | undefined,
    data: {
      amount?: number;
      contactName?: string;
      contactShortId?: string;
    },
  ): Promise<{ contact: Contact; settledAmount: number; remaining: number } | null> {
    // Find Contact
    let contact: Contact | null = null;
    if (data.contactShortId) {
      contact = await this.contactRepository.findByShortId(userId, data.contactShortId);
    }
    if (!contact && data.contactName) {
      const matches = await this.contactRepository.searchByName(userId, data.contactName, 1);
      contact = matches[0] || null;
    }

    if (!contact) return null;

    const currentOwed = Number(contact.totalOwed);
    let settleAmount = data.amount || currentOwed;

    // Safety Cap
    if (settleAmount > currentOwed) settleAmount = currentOwed;

    contact.totalOwed = Math.max(0, currentOwed - settleAmount);
    contact.lastInteractionAt = new Date();
    await this.contactRepository.update(contact);

    // Audit Trail (INCOME)
    await this.createTransaction(
      userId,
      organizationId,
      contact.id,
      TransactionType.INCOME,
      settleAmount,
      getCurrency(),
      `Remboursement de ${contact.displayName}`,
      TransactionStatus.COMPLETED,
    );

    return { contact, settledAmount: settleAmount, remaining: contact.totalOwed };
  }

  // --- Helpers ---

  async findOrCreateContact(
    userId: string,
    organizationId: string | undefined,
    data: { contactName: string; contactPhone?: string; contactContext?: string },
  ): Promise<Contact> {
    let contact: Contact | null = null;

    if (data.contactPhone) {
      contact = await this.contactRepository.findByPhone(userId, data.contactPhone);
    }

    if (!contact) {
      const matches = await this.contactRepository.searchByName(userId, data.contactName, 1);
      // Strict matching could be added here
      contact = matches[0] || null;
    }

    if (!contact) {
      contact = new Contact(userId, data.contactName, {
        organizationId: organizationId || undefined,
        phone: data.contactPhone,
        context: data.contactContext,
      });

      // Robust ShortId Generation with Check
      await this.assignUniqueShortId(contact);
      
      contact = await this.contactRepository.create(contact);
    }

    return contact;
  }

  private async assignUniqueShortId(contact: Contact): Promise<void> {
    let attempts = 0;
    let isUnique = false;
    while (!isUnique && attempts < 10) {
      contact.shortId = this.generateCryptoShortId(); // Use crypto
      isUnique = await this.contactRepository.isShortIdUnique(contact.ownerId, contact.shortId);
      attempts++;
    }
    if (!isUnique) throw new Error('Failed to generate unique Short ID');
  }

  /**
   * Cryptographically secure short ID
   */
  /**
   * Cryptographically secure short ID
   */
  private generateCryptoShortId(): string {
    const SHORT_ID_LENGTH = 6;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    const randomBytes = crypto.randomBytes(SHORT_ID_LENGTH);
    for (let i = 0; i < SHORT_ID_LENGTH; i++) {
        const index = randomBytes[i] % chars.length;
        result += chars[index];
    }
    return result; 
  }

  private async createTransaction(
    userId: string,
    organizationId: string | undefined,
    contactId: string,
    type: TransactionType,
    amount: number,
    currency: string,
    description: string,
    status: TransactionStatus = TransactionStatus.PENDING,
  ): Promise<void> {
    const tx = new Transaction(
      v4(),
      organizationId || userId,
      userId,
      null,
      type,
      amount,
      currency,
      'Debt',
      description,
      new Date(),
      new Date(),
      status,
      contactId,
    );
    await this.transactionRepository.create(tx);
  }
}
