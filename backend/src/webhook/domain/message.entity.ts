import { MessagingPlatforms } from '../../common/messaging/domain/constants/messaging-platforms.enum';

export enum MessageType {
  TEXT = 'text',
  PHOTO = 'photo',
  DOCUMENT = 'document',
  VOICE = 'voice',
  AUDIO = 'audio',
  UNKNOWN = 'unknown',
}

/**
 * Platform-agnostic message structure (Domain Entity)
 */
export interface MessageEntity {
  platform: MessagingPlatforms;
  senderId: string; // Phone number or UUID
  messageId: string;
  type: MessageType;
  content?: string;
  fileId?: string;
  metadata?: Record<string, any>;
  callbackData?: string;
}
