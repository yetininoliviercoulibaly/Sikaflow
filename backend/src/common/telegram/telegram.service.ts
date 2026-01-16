import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import {
  ITelegramService,
  ITelegramMessageOptions,
  IInlineKeyboardButton,
} from './telegram.service.interface';

@Injectable()
export class TelegramService implements ITelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly apiUrl = 'https://api.telegram.org';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  private get botToken(): string {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not set');
    return token;
  }

  private get baseUrl(): string {
    return `${this.apiUrl}/bot${this.botToken}`;
  }

  async sendMessage(
    chatId: string | number,
    text: string,
    options?: ITelegramMessageOptions,
  ): Promise<void> {
    try {
      const payload: Record<string, any> = {
        chat_id: chatId,
        text,
      };

      if (options?.parseMode) {
        payload.parse_mode = options.parseMode;
      }
      if (options?.disableWebPagePreview) {
        payload.disable_web_page_preview = options.disableWebPagePreview;
      }

      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/sendMessage`, payload),
      );

      this.logger.log(`Message sent to chat ${chatId}. Response: ${JSON.stringify(response.data)}`);
    } catch (error) {
      this.logger.error(
        `Failed to send message to chat ${chatId}`,
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  async sendDocument(
    chatId: string | number,
    document: Buffer,
    filename: string,
    caption?: string,
  ): Promise<void> {
    try {
      const formData = new FormData();
      // Convert Buffer to Uint8Array for Blob compatibility
      const blob = new Blob([new Uint8Array(document)], { type: 'application/octet-stream' });
      formData.append('chat_id', String(chatId));
      formData.append('document', blob, filename);
      if (caption) {
        formData.append('caption', caption);
      }

      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/sendDocument`, formData),
      );

      this.logger.log(`Document "${filename}" sent to chat ${chatId}`);
    } catch (error) {
      this.logger.error(
        `Failed to send document to chat ${chatId}`,
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  async downloadFile(fileId: string): Promise<{ buffer: Buffer; mimeType: string }> {
    try {
      // 1. Get file path from Telegram
      const fileInfoResponse = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/getFile`, {
          params: { file_id: fileId },
        }),
      );

      const filePath = fileInfoResponse.data.result.file_path;

      // 2. Download the actual file
      const fileUrl = `${this.apiUrl}/file/bot${this.botToken}/${filePath}`;
      const fileResponse = await firstValueFrom(
        this.httpService.get(fileUrl, { responseType: 'arraybuffer' }),
      );

      return {
        buffer: Buffer.from(fileResponse.data),
        mimeType: fileResponse.headers['content-type'] || 'application/octet-stream',
      };
    } catch (error) {
      this.logger.error(`Failed to download file ${fileId}`, error);
      throw new Error('File Download Failed');
    }
  }

  async sendInlineKeyboard(
    chatId: string | number,
    text: string,
    keyboard: IInlineKeyboardButton[][],
  ): Promise<void> {
    try {
      const payload = {
        chat_id: chatId,
        text,
        reply_markup: {
          inline_keyboard: keyboard,
        },
      };

      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/sendMessage`, payload),
      );

      this.logger.log(`Inline keyboard sent to chat ${chatId}`);
    } catch (error) {
      this.logger.error(
        `Failed to send inline keyboard to chat ${chatId}`,
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  async answerCallbackQuery(callbackQueryId: string, text?: string): Promise<void> {
    try {
      const payload: Record<string, any> = {
        callback_query_id: callbackQueryId,
      };
      if (text) {
        payload.text = text;
      }

      await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/answerCallbackQuery`, payload),
      );

      this.logger.log(`Answered callback query ${callbackQueryId}`);
    } catch (error) {
      this.logger.error(
        `Failed to answer callback query ${callbackQueryId}`,
        error.response?.data || error.message,
      );
      throw error;
    }
  }
}
