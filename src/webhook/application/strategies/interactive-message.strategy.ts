import { Injectable, Logger } from '@nestjs/common';
import { IMessageStrategy, LLMAnalysisResult } from './message-strategy.interface';
import { WhatsAppMessageDto } from '../dtos/whatsapp-payload.dto';

@Injectable()
export class InteractiveMessageStrategy implements IMessageStrategy {
  private readonly logger = new Logger(InteractiveMessageStrategy.name);

  constructor() {}

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

    // Handle Organization Switch
    if (selectedId.startsWith('SWITCH_ORG_ID_')) {
      const targetOrgId = selectedId.replace('SWITCH_ORG_ID_', '');
      
      return {
        intent: 'SWITCH_ORGANIZATION',
        data: { targetOrganizationId: targetOrgId },
        actions: [
            {
                intent: 'SWITCH_ORGANIZATION',
                data: { targetOrganizationId: targetOrgId }
            }
        ]
      };
    }

    // Handle Transaction Confirmation
    if (selectedId.startsWith('CONFIRM_TX|')) {
        const parts = selectedId.split('|');
        // CONFIRM_TX|Amount|Currency|Type|Category
        if (parts.length >= 5) {
             return {
                 intent: 'CREATE_TRANSACTION',
                 data: {
                     amount: parseFloat(parts[1]),
                     currency: parts[2],
                     type: parts[3],
                     category: parts[4],
                     confidence: 1.0 // Verified by user
                 },
                 actions: [{
                     intent: 'CREATE_TRANSACTION',
                     data: {
                         amount: parseFloat(parts[1]),
                         currency: parts[2],
                         type: parts[3],
                         category: parts[4],
                         confidence: 1.0
                     }
                 }]
             };
        }
    }

    // Handle Rejection
    if (selectedId === 'REJECT_TX') {
        return {
            intent: 'CANCEL_LAST_ACTION',
            data: {},
            actions: [{ intent: 'CANCEL_LAST_ACTION', data: {} }]
        };
    }

    return null;
  }
}
