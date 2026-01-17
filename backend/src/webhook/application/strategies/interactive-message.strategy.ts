import { Injectable, Logger } from '@nestjs/common';
import { IMessageStrategy, LLMAnalysisResult } from './message-strategy.interface';
import { WhatsAppMessageDto } from '../dtos/whatsapp-payload.dto';
import { CommandIntentMapper } from '../services/command-intent.mapper';

@Injectable()
export class InteractiveMessageStrategy implements IMessageStrategy {
  private readonly logger = new Logger(InteractiveMessageStrategy.name);

  constructor(private readonly commandIntentMapper: CommandIntentMapper) {}

  canHandle(message: WhatsAppMessageDto): boolean {
    return message.type === 'interactive';
  }

  async process(message: WhatsAppMessageDto, senderPhoneNumber: string): Promise<LLMAnalysisResult | null> {
    if (!message.interactive) return null;

    const interactive = message.interactive;
    let selectedId: string | undefined;

    if (interactive.type === 'list_reply' && interactive.list_reply) {
      selectedId = interactive.list_reply.id;
    } else if (interactive.type === 'button_reply' && interactive.button_reply) {
      selectedId = interactive.button_reply.id;
    }

    if (!selectedId) return null;

    this.logger.log(`Processing Interactive Reply: ${selectedId}`);

    // Use CommandIntentMapper for all IDs
    const mapped = this.commandIntentMapper.map(selectedId);
    if (mapped) {
        return {
            ...mapped,
            actions: [mapped]
        };
    }

    return null;

    return null;
  }
}

