import { Injectable, Inject, Logger } from '@nestjs/common';
import { IActionHandler, ActionContext } from './action-handler.interface';
import { I_CONTACT_REPOSITORY, IContactRepository } from '../../../contact/domain/ports/contact.repository.interface';
import { Contact } from '../../../contact/domain/contact.entity';
import { I_TRANSACTION_REPOSITORY, ITransactionRepository } from '../../../transaction/domain/ports/transaction.repository.interface';
import { Transaction, TransactionType, TransactionStatus } from '../../../transaction/domain/transaction.entity';
import { v4 } from 'uuid';

/**
 * Handler for debt-related intents:
 * - ADD_DEBT: "Bakary me doit 5000"
 * - ADD_CREDIT: "Je dois 5000 à Bakary"  
 * - LIST_DEBTS: "Qui me doit ?"
 * - LIST_CREDITS: "Je dois combien ?"
 * - SETTLE_DEBT: "Bakary a payé"
 * - SEND_REMINDER: "Relance Bakary"
 */
@Injectable()
export class DebtHandler implements IActionHandler {
  private readonly logger = new Logger(DebtHandler.name);

  constructor(
    @Inject(I_CONTACT_REPOSITORY)
    private readonly contactRepository: IContactRepository,
    @Inject(I_TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
  ) {}

  canHandle(intent: string): boolean {
    return [
      'ADD_DEBT',
      'ADD_CREDIT',
      'LIST_DEBTS',
      'LIST_CREDITS',
      'SETTLE_DEBT',
      'SEND_REMINDER',
    ].includes(intent);
  }

  async handle(data: Record<string, any>, context: ActionContext): Promise<void> {
    const { senderPhoneNumber, messagingService, user } = context;

    if (!user) {
      await messagingService.sendMessage(
        senderPhoneNumber,
        '❌ Vous devez être inscrit pour gérer vos créances.',
      );
      return;
    }

    const intent = data.intent as string;

    switch (intent) {
      case 'ADD_DEBT':
        await this.handleAddDebt(data, context);
        break;
      case 'ADD_CREDIT':
        await this.handleAddCredit(data, context);
        break;
      case 'LIST_DEBTS':
        await this.handleListDebts(context);
        break;
      case 'LIST_CREDITS':
        await this.handleListCredits(context);
        break;
      case 'SETTLE_DEBT':
        await this.handleSettleDebt(data, context);
        break;
      case 'SEND_REMINDER':
        await this.handleSendReminder(data, context);
        break;
      default:
        await messagingService.sendMessage(
          senderPhoneNumber,
          '❓ Action non reconnue.',
        );
    }
  }

  /**
   * Handle ADD_DEBT: Create or find contact, record debt
   * Expected data: { amount, contactName, contactPhone?, contactContext? }
   */
  private async handleAddDebt(
    data: Record<string, any>,
    context: ActionContext,
  ): Promise<void> {
    const { senderPhoneNumber, messagingService, user, organizationId } = context;
    const { amount, contactName, contactPhone, contactContext, currency = 'XOF' } = data;

    if (!amount || !contactName) {
      await messagingService.sendMessage(
        senderPhoneNumber,
        '❌ Veuillez préciser le montant et le nom du contact.\nEx: "Bakary me doit 5000" ou "Crédit 5000 pour Moussa 070..."',
      );
      return;
    }

    // Find or create contact
    let contact: Contact | null = null;

    // Try phone-first lookup
    if (contactPhone) {
      contact = await this.contactRepository.findByPhone(user!.id, contactPhone);
    }

    if (!contact) {
      // Search by name
      const matches = await this.contactRepository.searchByName(user!.id, contactName, 3);

      if (matches.length === 1) {
        contact = matches[0];
      } else if (matches.length > 1) {
        // Disambiguation needed
        const list = matches
          .map((c, i) => `${i + 1}. ${c.displayName}${c.context ? ` (${c.context})` : ''} - #${c.shortId}`)
          .join('\n');

        await messagingService.sendMessage(
          senderPhoneNumber,
          `🔍 Plusieurs contacts correspondent à "${contactName}" :\n\n${list}\n\nPrécisez avec le numéro de téléphone ou le code #XX1234.`,
        );
        return;
      }
    }

    // Create new contact if not found
    if (!contact) {
      contact = new Contact(user!.id, contactName, {
        organizationId: organizationId || undefined,
        phone: contactPhone,
        context: contactContext,
      });

      // Ensure unique shortId
      let attempts = 0;
      while (!(await this.contactRepository.isShortIdUnique(user!.id, contact.shortId)) && attempts < 5) {
        contact.shortId = Contact.generateShortId();
        attempts++;
      }

      await this.contactRepository.create(contact);
      this.logger.log(`Created new contact: ${contact.displayName} (#${contact.shortId})`);
    }

    // Update debt total
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      await messagingService.sendMessage(
        senderPhoneNumber,
        '❌ Montant invalide.',
      );
      return;
    }

    // Atomically update balance
    contact = await this.contactRepository.updateBalances(contact.id, numericAmount, 0);

    // Create DEBT transaction
    const transaction = new Transaction(
      v4(),
      organizationId!,
      user!.id,
      null,
      TransactionType.DEBT,
      numericAmount,
      currency,
      'debt',
      `Créance: ${contact.displayName}`,
      new Date(),
      new Date(),
      TransactionStatus.PENDING,
      contact.id
    );
    await this.transactionRepository.create(transaction);

    await messagingService.sendMessage(
      senderPhoneNumber,
      `✅ *Créance enregistrée !*\n\n👤 ${contact.displayName}${contact.context ? ` (${contact.context})` : ''}\n💰 +${numericAmount.toLocaleString('fr-FR')} ${currency}\n📊 Total dû : *${contact.totalOwed.toLocaleString('fr-FR')} ${currency}*\n🏷️ Code: #${contact.shortId}`,
    );
  }

  /**
   * Handle ADD_CREDIT: Record money user owes to someone
   */
  private async handleAddCredit(
    data: Record<string, any>,
    context: ActionContext,
  ): Promise<void> {
    const { senderPhoneNumber, messagingService, user, organizationId } = context;
    const { amount, contactName, contactPhone, contactContext, currency = 'XOF' } = data;

    if (!amount || !contactName) {
      await messagingService.sendMessage(
        senderPhoneNumber,
        '❌ Veuillez préciser le montant et le nom.\nEx: "Je dois 5000 à Bakary"',
      );
      return;
    }

    // Similar logic to ADD_DEBT but updates totalOwing
    let contact = contactPhone 
      ? await this.contactRepository.findByPhone(user!.id, contactPhone)
      : null;

    if (!contact) {
      const matches = await this.contactRepository.searchByName(user!.id, contactName, 1);
      contact = matches[0] || null;
    }

    if (!contact) {
      contact = new Contact(user!.id, contactName, {
        organizationId: organizationId || undefined,
        phone: contactPhone,
        context: contactContext,
      });
      await this.contactRepository.create(contact);
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      await messagingService.sendMessage(
        senderPhoneNumber,
        '❌ Montant invalide.',
      );
      return;
    }

    // Atomically update balance
    contact = await this.contactRepository.updateBalances(contact.id, 0, numericAmount);

    // Create CREDIT transaction (User owes money)
    const transaction = new Transaction(
      v4(),
      organizationId!,
      user!.id,
      null,
      TransactionType.CREDIT,
      numericAmount,
      currency,
      'debt',
      `Dette envers: ${contact.displayName}`,
      new Date(),
      new Date(),
      TransactionStatus.PENDING,
      contact.id
    );
    await this.transactionRepository.create(transaction);

    await messagingService.sendMessage(
      senderPhoneNumber,
      `✅ *Dette enregistrée !*\n\n👤 ${contact.displayName}\n💸 Vous devez : *${contact.totalOwing.toLocaleString('fr-FR')} ${currency}*\n🏷️ Code: #${contact.shortId}`,
    );
  }

  /**
   * Handle LIST_DEBTS: Show all contacts who owe money
   */
  private async handleListDebts(context: ActionContext): Promise<void> {
    const { senderPhoneNumber, messagingService, user, organizationId } = context;

    const contacts = await this.contactRepository.findWithPendingDebts(
      user!.id,
      organizationId || undefined,
    );

    if (contacts.length === 0) {
      await messagingService.sendMessage(
        senderPhoneNumber,
        '✅ Aucune créance en cours. Personne ne vous doit d\'argent !',
      );
      return;
    }

    const totalOwed = contacts.reduce((sum, c) => sum + c.totalOwed, 0);
    const list = contacts
      .slice(0, 10) // Limit to 10 for readability
      .map((c, i) => {
        const daysSince = Math.floor(
          (Date.now() - c.lastInteractionAt.getTime()) / (1000 * 60 * 60 * 24),
        );
        const alert = daysSince > 14 ? ' ⚠️' : '';
        return `${i + 1}. ${c.displayName} : *${c.totalOwed.toLocaleString('fr-FR')}F*${alert}`;
      })
      .join('\n');

    const moreCount = contacts.length > 10 ? `\n\n... et ${contacts.length - 10} autres.` : '';

    await messagingService.sendMessage(
      senderPhoneNumber,
      `📋 *Créances en cours* (${contacts.length} contacts)\n\n${list}${moreCount}\n\n💰 *Total : ${totalOwed.toLocaleString('fr-FR')}F*\n\n💡 Répondez "Relance [nom]" pour envoyer un rappel.`,
    );
  }

  /**
   * Handle LIST_CREDITS: Show money user owes
   */
  private async handleListCredits(context: ActionContext): Promise<void> {
    const { senderPhoneNumber, messagingService, user } = context;

    const contacts = await this.contactRepository.findByOwner(user!.id, { limit: 50 });
    const withCredits = contacts.filter((c) => c.totalOwing > 0);

    if (withCredits.length === 0) {
      await messagingService.sendMessage(
        senderPhoneNumber,
        '✅ Vous n\'avez aucune dette enregistrée.',
      );
      return;
    }

    const totalOwing = withCredits.reduce((sum, c) => sum + c.totalOwing, 0);
    const list = withCredits
      .map((c, i) => `${i + 1}. ${c.displayName} : *${c.totalOwing.toLocaleString('fr-FR')}F*`)
      .join('\n');

    await messagingService.sendMessage(
      senderPhoneNumber,
      `📋 *Vos dettes*\n\n${list}\n\n💸 *Total : ${totalOwing.toLocaleString('fr-FR')}F*`,
    );
  }

  /**
   * Handle SETTLE_DEBT: Mark debt as paid
   */
  private async handleSettleDebt(
    data: Record<string, any>,
    context: ActionContext,
  ): Promise<void> {
    const { senderPhoneNumber, messagingService, user } = context;
    const { contactName, contactShortId, amount } = data;

    let contact: Contact | null = null;

    // Find by shortId if provided
    if (contactShortId) {
      contact = await this.contactRepository.findByShortId(user!.id, contactShortId);
    }

    // Otherwise search by name
    if (!contact && contactName) {
      const matches = await this.contactRepository.searchByName(user!.id, contactName, 1);
      contact = matches[0] || null;
    }

    if (!contact) {
      await messagingService.sendMessage(
        senderPhoneNumber,
        `❌ Contact "${contactName || contactShortId}" non trouvé.`,
      );
      return;
    }

    // Settle amount (partial or full)
    const settleAmount = amount ? parseFloat(amount) : contact.totalOwed;
    if (isNaN(settleAmount) || settleAmount <= 0) {
      await messagingService.sendMessage(
        senderPhoneNumber,
        '❌ Montant invalide.',
      );
      return;
    }

    const remainingDebt = contact.totalOwed - settleAmount;
    let deltaOwed = -settleAmount;
    let deltaOwing = 0;

    // Handle overpayment (negative remaining debt becomes credit)
    if (remainingDebt < 0) {
        deltaOwed = -contact.totalOwed; // Reduce debt to exactly 0
        deltaOwing = Math.abs(remainingDebt); // Add rest as credit (I owe them)
    }

    contact = await this.contactRepository.updateBalances(contact.id, deltaOwed, deltaOwing);

    // Create INCOME transaction to represent payment received
    const transaction = new Transaction(
      v4(),
      context.organizationId!,
      user!.id,
      null,
      TransactionType.INCOME,
      settleAmount,
      'XOF', // Should ideally come from context or previous tx
      'reimbursement',
      `Remboursement de ${contact.displayName}`,
      new Date(),
      new Date(),
      TransactionStatus.COMPLETED,
      contact.id,
      null,
      new Date()
    );
    await this.transactionRepository.create(transaction);

    // Also mark related pending DEBT transactions as settled if full payment?
    // For now simple tracking.

    const status = contact.totalOwed === 0 ? '🎉 Créance soldée !' : `📉 Reste : ${contact.totalOwed.toLocaleString('fr-FR')}F`;

    await messagingService.sendMessage(
      senderPhoneNumber,
      `✅ *Paiement enregistré !*\n\n👤 ${contact.displayName}\n💰 Montant : ${settleAmount.toLocaleString('fr-FR')}F\n${status}`,
    );
  }

  /**
   * Handle SEND_REMINDER: Generate reminder message
   */
  private async handleSendReminder(
    data: Record<string, any>,
    context: ActionContext,
  ): Promise<void> {
    const { senderPhoneNumber, messagingService, user } = context;
    const { contactName, contactShortId } = data;

    let contact: Contact | null = null;

    if (contactShortId) {
      contact = await this.contactRepository.findByShortId(user!.id, contactShortId);
    } else if (contactName) {
      const matches = await this.contactRepository.searchByName(user!.id, contactName, 1);
      contact = matches[0] || null;
    }

    if (!contact) {
      await messagingService.sendMessage(
        senderPhoneNumber,
        `❌ Contact non trouvé. Précisez le nom ou le code #XX1234.`,
      );
      return;
    }

    if (contact.totalOwed <= 0) {
      await messagingService.sendMessage(
        senderPhoneNumber,
        `✅ ${contact.displayName} n'a pas de créance en cours.`,
      );
      return;
    }

    // Generate reminder message for user to forward
    const reminderMessage = `👋 Bonjour ${contact.displayName},\n\nPetit rappel amical : il reste un solde de *${contact.totalOwed.toLocaleString('fr-FR')}F* sur votre compte.\n\nMerci et bonne journée ! 🙏`;

    await messagingService.sendMessage(
      senderPhoneNumber,
      `📝 *Message de relance généré :*\n\n---\n${reminderMessage}\n---\n\n👆 Transférez ce message à ${contact.displayName}${contact.phone ? ` (${contact.phone})` : ''}.`,
    );
  }
}
