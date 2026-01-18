import { WhatsAppMessageDto } from '../dtos/whatsapp-payload.dto';

export interface LLMAnalysisResult {
  intent?: string;
  data?: any;
  confidence?: number;
  actions?: Array<{
    intent: string;
    data: any;
    missing_fields?: string[];
    organization_name?: string;
  }>;
}

export const MESSAGE_STRATEGY_TOKEN = 'MESSAGE_STRATEGY_TOKEN';

export interface IMessageStrategy {
  canHandle(message: WhatsAppMessageDto): boolean;
  process(message: WhatsAppMessageDto, senderPhoneNumber: string): Promise<LLMAnalysisResult | null>;
}
