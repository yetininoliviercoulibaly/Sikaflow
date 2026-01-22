import { Injectable, Logger } from '@nestjs/common';
import { TelegramUpdateDto, TelegramMessageDto } from '../../application/dtos/telegram-payload.dto';
import { UnifiedMessage, MessageType } from '../../domain/unified-message.interface';
import { MessagingPlatforms } from '../../../common/messaging/domain/constants/messaging-platforms.enum';

@Injectable()
export class TelegramParserService {
  private readonly logger = new Logger(TelegramParserService.name);

  /**
   * Transforms a Telegram Update into a UnifiedMessage
   */
  parse(update: TelegramUpdateDto): UnifiedMessage | null {
    // 1. Handle Callback Queries
    if (update.callback_query) {
      const cb = update.callback_query;
      return {
        platform: MessagingPlatforms.TELEGRAM,
        senderId: String(cb.message?.chat.id || cb.from.id),
        messageId: cb.id,
        type: MessageType.TEXT, // Callbacks are treated as text/command triggers
        content: cb.data,
        callbackData: cb.data,
        metadata: {
            fromId: cb.from.id,
            chatId: cb.message?.chat.id
        }
      };
    }

    // 2. Handle Regular Messages
    if (update.message) {
      const msg = update.message;
      const { type, content, fileId } = this.extractMessageContent(msg);

      if (!content && !fileId) return null;

      return {
        platform: MessagingPlatforms.TELEGRAM,
        senderId: String(msg.chat.id),
        messageId: String(msg.message_id),
        type,
        content,
        fileId,
        metadata: {
            fromId: msg.from?.id,
            date: msg.date
        }
      };
    }

    return null;
  }

  private extractMessageContent(message: TelegramMessageDto): {
    type: MessageType;
    content?: string;
    fileId?: string;
  } {
    if (message.text) {
      return { type: MessageType.TEXT, content: message.text };
    }
    if (message.photo && message.photo.length > 0) {
      const largestPhoto = message.photo[message.photo.length - 1];
      return { type: MessageType.PHOTO, fileId: largestPhoto.file_id, content: message.caption };
    }
    if (message.document) {
      return { type: MessageType.DOCUMENT, fileId: message.document.file_id, content: message.caption };
    }
    if (message.voice) {
      return { type: MessageType.VOICE, fileId: message.voice.file_id };
    }
    if (message.audio) {
      return { type: MessageType.AUDIO, fileId: message.audio.file_id };
    }
    return { type: MessageType.UNKNOWN };
  }
}
