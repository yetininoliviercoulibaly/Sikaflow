import { Injectable, Inject } from '@nestjs/common';
import { z } from 'zod';
import { BaseTool } from './base.tool';
import { ContactService } from '../../contact/application/services/contact.service';
import { IContactRepository, I_CONTACT_REPOSITORY } from '../../contact/domain/ports/contact.repository.interface';
import { IMessagingService, I_MESSAGING_SERVICE } from '../../common/messaging/messaging.service.interface';
import { IPaymentProvider, PAYMENT_PROVIDER_TOKEN } from '../../payment/domain/ports/payment-provider.interface';
import { TelegramMessagingAdapter } from '../../common/messaging/telegram-messaging.adapter';

@Injectable()
export class SendReminderTool extends BaseTool<any> {
  name = 'send_reminder';
  description = 'Sends a payment reminder (via WhatsApp/Telegram/SMS) to a contact who owes money.';
  
  schema = z.object({
    userId: z.string().describe('The ID of the user sending the reminder.'),
    contactName: z.string().describe('Name of the contact to remind.'),
    platform: z.string().describe('The platform to use (e.g., TELEGRAM, WHATSAPP).'),
  });

  constructor(
      @Inject(I_CONTACT_REPOSITORY) private readonly contactRepository: IContactRepository,
      private readonly telegramMessagingAdapter: TelegramMessagingAdapter,
      @Inject(PAYMENT_PROVIDER_TOKEN) private readonly paymentProvider: IPaymentProvider,
  ) {
    super();
  }

  protected async _call(input: z.infer<typeof this.schema>): Promise<string> {
    return this.handleSafe(async () => {
        const contacts = await this.contactRepository.searchByName(input.userId, input.contactName, 1);
        const contact = contacts[0];

        if (!contact) return `Contact "${input.contactName}" not found.`;
        if (contact.totalOwed <= 0) return `${contact.displayName} does not owe anything.`;
        if (!contact.phone) return `No phone number found for ${contact.displayName}.`;

        // Generate payment link (optional but good)
        let paymentLink = '';
        try {
            paymentLink = await this.paymentProvider.createPaymentLink(contact.totalOwed, 'XOF', {
                contactId: contact.id,
                reason: 'Debt Reminder',
                senderId: input.userId
            });
        } catch (e) {}

        const message = `👋 Hello ${contact.displayName}, this is a reminder regarding your debt of ${contact.totalOwed} XOF. Please settle it soon. 🙏` + 
            (paymentLink ? `\n\nPay here: ${paymentLink}` : '');

        await this.telegramMessagingAdapter.sendMessage(contact.phone, message);
        
        return `Reminder successfully sent to ${contact.displayName} (${contact.phone}).`;
    });
  }
}
