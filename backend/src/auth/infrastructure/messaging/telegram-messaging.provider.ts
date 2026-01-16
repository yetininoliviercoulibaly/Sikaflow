import { Inject, Injectable } from '@nestjs/common';
import { IMessagingProvider } from '../../domain/ports/messaging-provider.interface';
import { ITelegramService, I_TELEGRAM_SERVICE } from '../../../common/telegram/telegram.service.interface';

/**
 * Telegram implementation of MessagingProvider for authentication flows
 * Used to send magic links via Telegram messages
 */
@Injectable()
export class TelegramMessagingProvider implements IMessagingProvider {
  constructor(
    @Inject(I_TELEGRAM_SERVICE)
    private readonly telegramService: ITelegramService,
  ) {}

  async sendMagicLink(chatId: string, link: string, language?: string): Promise<void> {
    const isEn = language === 'en';

    const message = isEn
      ? `🔐 *SikaFlow Dashboard Login*\n\nClick this link to access your dashboard (Valid for 15 min):\n\n${link}\n\n_If you did not request this, please ignore this message._`
      : `🔐 *Connexion Dashboard SikaFlow*\n\nCliquez sur ce lien pour accéder à votre tableau de bord (Valide 15 min) :\n\n${link}\n\n_Si vous n'êtes pas à l'origine de cette demande, ignorez ce message._`;

    await this.telegramService.sendMessage(chatId, message, { parseMode: 'Markdown' });
  }
}
