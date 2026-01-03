import { Inject, Injectable, Logger } from '@nestjs/common';
import { IMessageStrategy, LLMAnalysisResult } from './message-strategy.interface';
import { WhatsAppMessageDto } from '../dtos/whatsapp-payload.dto';
import { ILLMProvider, LLM_PROVIDER_TOKEN } from '../../../common/llm/llm-provider.interface';
import { IPromptRepository, I_PROMPT_REPOSITORY } from '../../../common/prompt/domain/ports/prompt.repository.interface';

@Injectable()
export abstract class BaseMessageStrategy implements IMessageStrategy {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(
    @Inject(LLM_PROVIDER_TOKEN) protected readonly llmProvider: ILLMProvider,
    @Inject(I_PROMPT_REPOSITORY) protected readonly promptRepository: IPromptRepository,
  ) {}

  abstract canHandle(message: WhatsAppMessageDto): boolean;
  abstract process(message: WhatsAppMessageDto, senderPhoneNumber: string): Promise<LLMAnalysisResult | null>;

  protected async analyzeText(text: string, senderPhoneNumber: string): Promise<LLMAnalysisResult> {
     // Common logic for Prompt Fetching + Text Analysis
     const organizationId = undefined; // Fallback to Global
     const promptKey = 'analyze_message'; 
     
     const template = await this.promptRepository.getTemplate(promptKey, organizationId);
     const systemPrompt = template ? template.content : undefined;

     return this.llmProvider.analyzeText(text, { 
        context: { userPhone: senderPhoneNumber },
        systemPrompt: systemPrompt
    });
  }
}
