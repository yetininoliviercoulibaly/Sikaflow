/**
 * Telegram Service Interface
 * Defines the contract for Telegram Bot API operations
 */

export interface ITelegramService {
  /**
   * Send a text message to a Telegram chat
   */
  sendMessage(
    chatId: string | number,
    text: string,
    options?: ITelegramMessageOptions,
  ): Promise<void>;

  /**
   * Send a document to a Telegram chat
   */
  sendDocument(
    chatId: string | number,
    document: Buffer,
    filename: string,
    caption?: string,
  ): Promise<void>;

  /**
   * Download a file from Telegram servers
   */
  downloadFile(fileId: string): Promise<{ buffer: Buffer; mimeType: string }>;

  /**
   * Send a message with inline keyboard buttons
   */
  sendInlineKeyboard(
    chatId: string | number,
    text: string,
    keyboard: IInlineKeyboardButton[][],
  ): Promise<void>;

  /**
   * Answer a callback query (button press acknowledgement)
   */
  answerCallbackQuery(callbackQueryId: string, text?: string): Promise<void>;
}

export interface ITelegramMessageOptions {
  parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  disableWebPagePreview?: boolean;
}

export interface IInlineKeyboardButton {
  text: string;
  callback_data?: string;
  url?: string;
}

export const I_TELEGRAM_SERVICE = 'I_TELEGRAM_SERVICE';
