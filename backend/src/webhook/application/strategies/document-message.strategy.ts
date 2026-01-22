import { Injectable, Inject } from '@nestjs/common';
import { BaseMessageStrategy } from './base-message.strategy';
import { WhatsAppMessageDto } from '../dtos/whatsapp-payload.dto';
import { LLMAnalysisResult } from './message-strategy.interface';
import { WhatsAppService } from '../../../common/whatsapp/whatsapp.service';
import { ILLMProvider, LLM_PROVIDER_TOKEN } from '../../../common/llm/llm-provider.interface';
import { IPromptRepository, I_PROMPT_REPOSITORY } from '../../../common/prompt/domain/ports/prompt.repository.interface';

@Injectable()
export class DocumentMessageStrategy extends BaseMessageStrategy {
  constructor(
      @Inject(LLM_PROVIDER_TOKEN) llmProvider: ILLMProvider,
      @Inject(I_PROMPT_REPOSITORY) promptRepository: IPromptRepository,
      private readonly whatsAppService: WhatsAppService
  ) {
      super(llmProvider, promptRepository);
  }

  canHandle(message: WhatsAppMessageDto): boolean {
    return message.type === 'document' && 
           (message.document?.mime_type === 'application/pdf');
  }

  async process(message: WhatsAppMessageDto, senderPhoneNumber: string, context?: any): Promise<LLMAnalysisResult | null> {
    const document = message.document;
    if (!document) return null;

    try {
        // Download Media
        const media = await this.whatsAppService.downloadMedia(document.id);
        const base64 = media.buffer.toString('base64');
        
        // Fetch Prompt
        const template = await this.promptRepository.getTemplate('analyze_media', undefined);
        const systemPrompt = template ? template.content : "Analyze this document.";

        // Analyze
        return this.llmProvider.analyzeMedia(base64, media.mimeType, {
            context: { 
                userPhone: senderPhoneNumber,
                ...context 
            },
            prompt: systemPrompt
        });

    } catch (e) {
        this.logger.error('Error analyzing document', e);
        return null;
    }
  }
}
