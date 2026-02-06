import { Injectable, Inject, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IActionHandler, ActionContext } from './action-handler.interface';
import { I_CONTACT_REPOSITORY, IContactRepository } from '../../../contact/domain/ports/contact.repository.interface';
import { ContactService } from '../../../contact/application/services/contact.service';
import { AddDebtPayload, SettleDebtPayload, SendReminderPayload } from '../dtos/debt.dto';
import { DebtIntents } from '../constants/debt.constants';
import { MessagingPlatforms } from '../../../common/messaging/domain/constants/messaging-platforms.enum';
import { IPaymentProvider, PAYMENT_PROVIDER_TOKEN } from '../../../payment/domain/ports/payment-provider.interface';
import { getCurrency } from '../../../common/utils/currency.util';

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
    private readonly contactService: ContactService,
    @Inject(PAYMENT_PROVIDER_TOKEN) private readonly paymentProvider: IPaymentProvider,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  canHandle(intent: string): boolean {
    return Object.values(DebtIntents).includes(intent as any);
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

    try {
      switch (intent) {
        case DebtIntents.ADD_DEBT:
          await this.handleAddDebt(data as unknown as AddDebtPayload, context);
          break;
        case DebtIntents.ADD_CREDIT:
          await this.handleAddCredit(data as unknown as AddDebtPayload, context);
          break;
        case DebtIntents.LIST_DEBTS:
          await this.handleListDebts(context);
          break;
        case DebtIntents.LIST_CREDITS:
          await this.handleListCredits(context);
          break;
        case DebtIntents.SETTLE_DEBT:
          await this.handleSettleDebt(data as unknown as SettleDebtPayload, context);
          break;
        case DebtIntents.SEND_REMINDER:
          await this.handleSendReminder(data as unknown as SendReminderPayload, context);
          break;
        default:
          await messagingService.sendMessage(
            senderPhoneNumber,
            '❓ Action non reconnue.',
          );
      }
    } catch (error) {
      this.logger.error(`Error handling debt intent ${intent}`, error);
      await messagingService.sendMessage(
        senderPhoneNumber,
        '❌ Une erreur est survenue lors du traitement de votre demande.',
      );
    }
  }

  /**
   * Handle ADD_DEBT: Create or find contact, record debt
   */
  private async handleAddDebt(
    data: AddDebtPayload,
    context: ActionContext,
  ): Promise<void> {
    const { senderPhoneNumber, messagingService, user, organizationId } = context;
    const rawData = data as any;
    // Support both matches (LLM often returns snake_case)
    const amount = rawData.amount; 
    const contactName = rawData.contactName || rawData.contact_name;
    const contactPhone = rawData.contactPhone || rawData.contact_phone;
    const contactContext = rawData.contactContext || rawData.contact_context;
    const currency = rawData.currency || getCurrency();

    if (!amount || !contactName) {
      await messagingService.sendMessage(
        senderPhoneNumber,
        '❌ Veuillez préciser le montant et le nom du contact.\nEx: "Bakary me doit 5000" ou "Crédit 5000 pour Moussa 070..."',
      );
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
       await messagingService.sendMessage(
        senderPhoneNumber,
        '❌ Le montant doit être un nombre positif valide.',
      );
      return;
    }

    // Delegate to Service
    const contact = await this.contactService.addDebt(user!.id, organizationId || undefined, {
      amount: numericAmount,
      contactName,
      contactPhone,
      contactContext,
      currency,
    });

    await messagingService.sendMessage(
      senderPhoneNumber,
      `✅ *Créance enregistrée !*\n\n👤 ${contact.displayName}${contact.context ? ` (${contact.context})` : ''}\n💰 +${numericAmount.toLocaleString('fr-FR')} ${currency}\n📊 Total dû : *${contact.totalOwed.toLocaleString('fr-FR')} ${currency}*\n🏷️ Code: #${contact.shortId}`,
    );

    // Emit Event for Onboarding
    this.eventEmitter.emit('debt.created', {
      userId: user!.id,
      organizationId: context.organizationId,
      senderPhoneNumber,
      platform: context.platform,
    });
  }

  /**
   * Handle ADD_CREDIT: Record money user owes to someone
   */
  private async handleAddCredit(
    data: AddDebtPayload,
    context: ActionContext,
  ): Promise<void> {
    const { senderPhoneNumber, messagingService, user, organizationId } = context;
    const rawData = data as any;
    // Support both matches (LLM often returns snake_case)
    const amount = rawData.amount;
    const contactName = rawData.contactName || rawData.contact_name;
    const contactPhone = rawData.contactPhone || rawData.contact_phone;
    const contactContext = rawData.contactContext || rawData.contact_context;
    const currency = rawData.currency || getCurrency();

    if (!amount || !contactName) {
      await messagingService.sendMessage(
        senderPhoneNumber,
        '❌ Veuillez préciser le montant et le nom.\nEx: "Je dois 5000 à Bakary"',
      );
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
       await messagingService.sendMessage(
        senderPhoneNumber,
        '❌ Le montant doit être un nombre positif valide.',
      );
      return;
    }

    // Delegate to Service
    const contact = await this.contactService.addCredit(user!.id, organizationId || undefined, {
      amount: numericAmount,
      contactName,
      contactPhone,
      contactContext,
      currency,
    });

    await messagingService.sendMessage(
      senderPhoneNumber,
      `✅ *Dette enregistrée !*\n\n👤 ${contact.displayName}\n💸 Vous devez : *${contact.totalOwing.toLocaleString('fr-FR')} ${currency}*\n🏷️ Code: #${contact.shortId}`,
    );

    // Emit Event for Onboarding
    this.eventEmitter.emit('debt.created', {
      userId: user!.id,
      organizationId: context.organizationId,
      senderPhoneNumber,
      platform: context.platform,
    });
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

    // Ensure numeric conversion to avoid string concatenation
    const totalOwed = contacts.reduce((sum, c) => sum + Number(c.totalOwed), 0); 
    const currency = getCurrency();

    const list = contacts
      .slice(0, 10) // Limit to 10 for readability
      .map((c, i) => {
        const daysSince = Math.floor(
          (Date.now() - c.lastInteractionAt.getTime()) / (1000 * 60 * 60 * 24),
        );
        const alert = daysSince > 14 ? ' ⚠️' : '';
        return `${i + 1}. ${c.displayName} : *${Number(c.totalOwed).toLocaleString('fr-FR')} ${currency}*${alert}`;
      })
      .join('\n');

    const moreCount = contacts.length > 10 ? `\n\n... et ${contacts.length - 10} autres.` : '';

    await messagingService.sendMessage(
      senderPhoneNumber,
      `📋 *Créances en cours* (${contacts.length} contacts)\n\n${list}${moreCount}\n\n💰 *Total : ${totalOwed.toLocaleString('fr-FR')} ${currency}*\n\n💡 Répondez "Relance [nom]" pour envoyer un rappel.`,
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

    const currency = getCurrency();

    // Ensure numeric conversion
    const totalOwing = withCredits.reduce((sum, c) => sum + Number(c.totalOwing), 0);
    const list = withCredits
      .map((c, i) => `${i + 1}. ${c.displayName} : *${Number(c.totalOwing).toLocaleString('fr-FR')} ${currency}*`)
      .join('\n');

    await messagingService.sendMessage(
      senderPhoneNumber,
      `📋 *Vos dettes*\n\n${list}\n\n💸 *Total : ${totalOwing.toLocaleString('fr-FR')} ${currency}*`,
    );
  }

  /**
   * Handle SETTLE_DEBT: Mark debt as paid
   */
  private async handleSettleDebt(
    data: SettleDebtPayload,
    context: ActionContext,
  ): Promise<void> {
    const { senderPhoneNumber, messagingService, user, organizationId } = context;
    const rawData = data as any;
    const contactName = rawData.contactName || rawData.contact_name;
    const contactShortId = rawData.contactShortId || rawData.contact_short_id;
    const amount = rawData.amount;

    const numericAmount = amount ? parseFloat(amount) : undefined;
    if (numericAmount !== undefined && (isNaN(numericAmount) || numericAmount <= 0)) {
       await messagingService.sendMessage(senderPhoneNumber, '❌ Montant invalide.');
       return;
    }

    // Delegate to Service
    const result = await this.contactService.settleDebt(user!.id, organizationId || undefined, {
      amount: numericAmount,
      contactName,
      contactShortId,
    });

    if (!result) {
      await messagingService.sendMessage(
        senderPhoneNumber,
        `❌ Contact "${contactName || contactShortId}" non trouvé.`,
      );
      return;
    }

    const { contact, settledAmount } = result;
    const status = contact.totalOwed === 0 ? '🎉 Créance soldée !' : `📉 Reste : ${contact.totalOwed.toLocaleString('fr-FR')}F`;

    await messagingService.sendMessage(
      senderPhoneNumber,
      `✅ *Paiement enregistré !*\n\n👤 ${contact.displayName}\n💰 Montant : ${settledAmount.toLocaleString('fr-FR')}F\n${status}`,
    );
  }

  /**
   * Handle SEND_REMINDER: Send reminder via WhatsApp/SMS
   */
  private async handleSendReminder(
    data: SendReminderPayload,
    context: ActionContext,
  ): Promise<void> {
    const { senderPhoneNumber, messagingService, user, platform } = context;
    const rawData = data as any;
    const contactName = rawData.contactName || rawData.contact_name;
    
    if (!contactName) {
        await messagingService.sendMessage(senderPhoneNumber, '❌ Précisez le nom du contact à relancer.');
        return;
    }

    const contacts = await this.contactRepository.searchByName(user!.id, contactName, 1);
    const contact = contacts[0];

    if (!contact) {
      await messagingService.sendMessage(senderPhoneNumber, `❌ Contact "${contactName}" introuvable.`);
      return;
    }

    if (contact.totalOwed <= 0) {
      await messagingService.sendMessage(senderPhoneNumber, `✅ ${contact.displayName} ne vous doit rien.`);
      return;
    }

    if (!contact.phone) {
         await messagingService.sendMessage(senderPhoneNumber, `❌ impossible de relancer ${contact.displayName} : aucun numéro de téléphone associé.`);
         return;
    }

    // Determine platform link
    let link = '';
    if (platform === MessagingPlatforms.WHATSAPP) {
        // Remove +, spaces, etc.
        const cleanPhone = contact.phone.replace(/[^0-9]/g, '');
        link = `https://wa.me/${cleanPhone}`;
    } else if (platform === MessagingPlatforms.TELEGRAM) {
        // Telegram often uses username, but t.me/+phone sometimes works if they allow it
        const cleanPhone = contact.phone.replace(/[^0-9]/g, '');
        link = `https://t.me/+${cleanPhone}`;
    }

    // Generate Smart Payment Link
    let paymentLink = '';
    try {
        const amount = contact.totalOwed;
        if (amount > 0) {
            paymentLink = await this.paymentProvider.createPaymentLink(
                amount,
                getCurrency(), // Currency derived from util
                {
                    contactId: contact.id,
                    reason: 'Debt Settlement',
                    senderId: user!.id
                }
            );
        }
    } catch (error) {
        this.logger.warn(`Failed to generate payment link for ${contact.id}: ${error.message}`);
    }

    // Send formatted reminder to the Debtor
    const baseMessage = `👋 Bonjour ${contact.displayName},\n\nCeci est un rappel de ${user!.fullName || 'votre contact'} concernant une dette de *${contact.totalOwed.toLocaleString('fr-FR')} FCFA*.\n\nMerci de régulariser dès que possible ! 🙏`;
    const messageWithLink = paymentLink 
        ? `${baseMessage}\n\n💳 *Payer maintenant :* ${paymentLink}`
        : baseMessage;

    await messagingService.sendMessage(
        contact.phone,
        messageWithLink
    );

    await messagingService.sendMessage(
        senderPhoneNumber,
        `✅ Relance envoyée à ${contact.displayName} (${contact.phone}).` + (link ? `\n🔗 Lien: ${link}` : '')
    );
  }
}
