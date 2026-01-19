import { Injectable, Logger } from '@nestjs/common';
import { IMessagingProvider } from '../../domain/ports/messaging-provider.interface';
import { WhatsAppService } from '../../../common/whatsapp/whatsapp.service';
import { TelegramService } from '../../../common/telegram/telegram.service';

@Injectable()
export class CompositeAuthMessagingProvider implements IMessagingProvider {
  private readonly logger = new Logger(CompositeAuthMessagingProvider.name);

  constructor(
    private readonly whatsAppService: WhatsAppService,
    private readonly telegramService: TelegramService,
  ) {}

  async sendMagicLink(phoneNumber: string, link: string): Promise<void> {
    // Heuristic: WhatsApp numbers in our system usually start with '+' (E.164)
    // Telegram IDs do not.
    const isWhatsApp = phoneNumber.startsWith('+');

    if (isWhatsApp) {
      await this.sendWhatsApp(phoneNumber, link);
    } else {
      await this.sendTelegram(phoneNumber, link);
    }
  }

  private async sendWhatsApp(phoneNumber: string, link: string): Promise<void> {
    const message = `🔐 *Connexion SikaFlow*\n\nCliquez sur ce lien pour accéder à votre tableau de bord :\n\n${link}\n\n_Ce lien expire dans 15 minutes._`;
    try {
        await this.whatsAppService.sendMessage(phoneNumber, message);
    } catch (error) {
       this.logger.error(`Failed to send WhatsApp message: ${error.message}`);
       throw error;
    }
  }

  private async sendTelegram(chatId: string, link: string): Promise<void> {
    const message = `🔐 *Connexion SikaFlow*\n\nCliquez sur ce lien pour accéder à votre tableau de bord :\n\n[Accéder au Dashboard](${link})\n\n_Ce lien expire dans 15 minutes._`;
    try {
        await this.telegramService.sendMessage(chatId, message);
        this.logger.log(`Magic link sent via Telegram to ${chatId}`);
    } catch (error) {
        this.logger.error(`Failed to send Telegram message to ${chatId}: ${error.message}`);
        // Fallback or re-throw
        throw error;
    }
  }
}
