import { Injectable, Logger } from '@nestjs/common';
import { ILLMProvider } from './llm-provider.interface';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';

@Injectable()
export class FakeLLMProvider implements ILLMProvider {
  private readonly logger = new Logger(FakeLLMProvider.name);

  getModel(): BaseChatModel {
      return {
          invoke: async () => ({ content: 'Fake Response' }),
          bind: () => ({} as any),
          pipe: () => ({} as any),
      } as unknown as BaseChatModel;
  }

  async analyzeText(text: string, options?: { context?: Record<string, any>; systemPrompt?: string }): Promise<any> {
    this.logger.log(`[FakeLLM] Analyzing text: "${text}" with context: ${JSON.stringify(options?.context)}`);
    
    // Simple mock logic for testing "Expense" creation
    // If text contains "dépense" or "expense" or numbers, assume transaction
    const lower = text.toLowerCase();
    
    if (lower.includes('dépense') || lower.includes('achat') || !isNaN(parseFloat(text))) {
        // Mock extraction
        const amountMatch = text.match(/[\d\.,]+/);
        const amount = amountMatch ? parseFloat(amountMatch[0].replace(',', '.')) : 10;
        
        return {
            intent: 'CREATE_TRANSACTION',
            data: {
                amount: amount,
                category: 'Logistique',
                description: text,
                type: 'EXPENSE'
            }
        };
    }

    return { intent: 'UNKNOWN', data: {} };
  }

  async analyzeMedia(base64Data: string, mimeType: string, options?: { context?: Record<string, any>; prompt?: string }): Promise<any> {
    this.logger.log(`[FakeLLM] Analyzing media (Base64)`);
    return { intent: 'UNKNOWN' };
  }

  async transcribeAudio(audioUrl: string): Promise<string> {
      return "Fake Transcription";
  }
}
