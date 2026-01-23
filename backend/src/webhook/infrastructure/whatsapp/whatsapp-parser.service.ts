import { Injectable, Logger } from '@nestjs/common';
import { WhatsAppPayloadDto, WhatsAppMessageDto } from '../../application/dtos/whatsapp-payload.dto';
import { MessageEntity, MessageType } from '../../domain/message.entity';
import { MessagingPlatforms } from '../../../common/messaging/domain/constants/messaging-platforms.enum';

@Injectable()
export class WhatsAppParserService {
  private readonly logger = new Logger(WhatsAppParserService.name);

  /**
   * Transforms a WhatsApp Payload into a UnifiedMessage array
   */
  parse(payload: WhatsAppPayloadDto): MessageEntity[] {
    const entry = payload.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;
    
    if (!messages || messages.length === 0) return [];

    return messages.map(msg => this.mapMessage(msg));
  }

  private mapMessage(msg: WhatsAppMessageDto): MessageEntity {
    const type = this.mapType(msg.type);
    let content = '';

    if (msg.type === 'text') {
      content = msg.text?.body || '';
    } else if (msg.type === 'interactive') {
      const interactive = msg.interactive;
      const reply = interactive?.list_reply || interactive?.button_reply;
      content = reply?.id || '';
    }

    return {
      platform: MessagingPlatforms.WHATSAPP,
      senderId: msg.from,
      messageId: msg.id,
      type,
      content,
      fileId: this.extractFileId(msg),
      callbackData: msg.type === 'interactive' ? content : undefined,
      metadata: {
        timestamp: msg.timestamp,
        displayPhoneNumber: msg.from
      }
    };
  }

  private mapType(type: string): MessageType {
    switch (type) {
      case 'text': return MessageType.TEXT;
      case 'image': return MessageType.PHOTO;
      case 'audio': return MessageType.AUDIO;
      case 'voice': return MessageType.VOICE;
      case 'document': return MessageType.DOCUMENT;
      case 'interactive': return MessageType.TEXT;
      default: return MessageType.UNKNOWN;
    }
  }

  private extractFileId(msg: WhatsAppMessageDto): string | undefined {
    return msg.image?.id || msg.audio?.id || msg.document?.id;
  }
}
