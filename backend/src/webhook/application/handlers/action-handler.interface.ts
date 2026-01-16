import { User } from '../../../user/domain/user.entity';
import { IMessagingService } from '../../../common/messaging/messaging.service.interface';
import { MessagingPlatforms } from '../../../common/messaging/domain/constants/messaging-platforms.enum';

/**
 * Platform type for messaging (WhatsApp or Telegram)
 */
export type MessagingPlatform = MessagingPlatforms.WHATSAPP | MessagingPlatforms.TELEGRAM;

/**
 * Context passed to action handlers containing all necessary information
 * to process an action and respond to the user
 */
export interface ActionContext {
  /** The recipient identifier (phone number for WhatsApp, chat ID for Telegram) */
  senderPhoneNumber: string;
  
  /** Organization ID if user has an active organization */
  organizationId: string | null;
  
  /** Unique message identifier */
  messageId: string;
  
  /** Original message body text (if available) */
  messageBody?: string;
  
  /** Fields that are missing for the action to complete */
  missingFields?: string[];
  
  /** User's preferred language */
  language?: string;
  
  /** Pre-fetched user to avoid duplicate DB lookups in handlers */
  user?: User | null;
  
  /** The messaging platform the message came from */
  platform: MessagingPlatform;
  
  /** Platform-agnostic messaging service for sending responses */
  messagingService: IMessagingService;
}

/**
 * Interface for action handlers that process user intents
 */
export interface IActionHandler {
  canHandle(intent: string): boolean;
  handle(data: Record<string, any>, context: ActionContext): Promise<void>;
}

export const ACTION_HANDLER_TOKEN = 'ACTION_HANDLER_TOKEN';
