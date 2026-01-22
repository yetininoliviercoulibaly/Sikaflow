import { Injectable } from '@nestjs/common';
import { BaseMessageStrategy } from './base-message.strategy';
import { WhatsAppMessageDto } from '../dtos/whatsapp-payload.dto';
import { LLMAnalysisResult } from './message-strategy.interface';

@Injectable()
export class TextMessageStrategy extends BaseMessageStrategy {
  canHandle(message: WhatsAppMessageDto): boolean {
    return message.type === 'text' && !!message.text;
  }

  async process(message: WhatsAppMessageDto, senderPhoneNumber: string, context?: any): Promise<LLMAnalysisResult | null> {
    const text = message.text?.body;
    if (!text) return null;

    return this.analyzeText(text, senderPhoneNumber, context);
  }
}
