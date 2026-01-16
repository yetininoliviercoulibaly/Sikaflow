import { Inject, Injectable } from '@nestjs/common';
import {
  IMessagingService,
  IMessageButton,
  IMessageSection,
} from './messaging.service.interface';
import { ITelegramService, I_TELEGRAM_SERVICE } from '../telegram/telegram.service.interface';

/**
 * Telegram implementation of the platform-agnostic messaging service
 */
@Injectable()
export class TelegramMessagingAdapter implements IMessagingService {
  constructor(
    @Inject(I_TELEGRAM_SERVICE)
    private readonly telegramService: ITelegramService,
  ) {}

  async sendMessage(to: string, text: string): Promise<void> {
    await this.telegramService.sendMessage(to, text);
  }

  async sendDocument(
    to: string,
    buffer: Buffer,
    filename: string,
    caption?: string,
  ): Promise<void> {
    await this.telegramService.sendDocument(to, buffer, filename, caption);
  }

  async sendInteractiveButtons(
    to: string,
    bodyText: string,
    buttons: IMessageButton[],
  ): Promise<void> {
    // Map to Telegram inline keyboard format
    const keyboard = buttons.map(b => ([{
      text: b.title,
      callback_data: b.id,
    }]));

    await this.telegramService.sendInlineKeyboard(to, bodyText, keyboard);
  }

  async sendInteractiveList(
    to: string,
    header: string,
    body: string,
    buttonText: string,
    sections: IMessageSection[],
  ): Promise<void> {
    // Telegram doesn't have native list support like WhatsApp
    // Convert to inline keyboard with sections as button rows
    const keyboard = sections.flatMap(section =>
      section.rows.map(row => ([{
        text: `${row.title}${row.description ? ` - ${row.description}` : ''}`,
        callback_data: row.id,
      }]))
    );

    const messageText = `*${header}*\n\n${body}`;
    await this.telegramService.sendInlineKeyboard(to, messageText, keyboard);
  }

  async downloadMedia(fileId: string): Promise<{ buffer: Buffer; filename?: string }> {
    return this.telegramService.downloadFile(fileId);
  }
}
