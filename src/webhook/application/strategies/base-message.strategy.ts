import { Inject, Injectable, Logger } from '@nestjs/common';
import { IMessageStrategy, LLMAnalysisResult } from './message-strategy.interface';
import { WhatsAppMessageDto } from '../dtos/whatsapp-payload.dto';
import { ILLMProvider, LLM_PROVIDER_TOKEN } from '../../../common/llm/llm-provider.interface';
import { IPromptRepository, I_PROMPT_REPOSITORY } from '../../../common/prompt/domain/ports/prompt.repository.interface';

@Injectable()
export abstract class BaseMessageStrategy implements IMessageStrategy {
  protected readonly logger = new Logger(this.constructor.name);

  /** In-memory cache for prompts (5 minute TTL) */
  private static promptCache = new Map<string, { content: string; expires: number }>();
  private static readonly PROMPT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(
    @Inject(LLM_PROVIDER_TOKEN) protected readonly llmProvider: ILLMProvider,
    @Inject(I_PROMPT_REPOSITORY) protected readonly promptRepository: IPromptRepository,
  ) {}

  abstract canHandle(message: WhatsAppMessageDto): boolean;
  abstract process(message: WhatsAppMessageDto, senderPhoneNumber: string): Promise<LLMAnalysisResult | null>;

  /** Get prompt from cache or fetch from DB */
  protected async getPromptCached(key: string, organizationId?: string): Promise<string | undefined> {
    const cacheKey = `${key}:${organizationId || 'global'}`;
    const cached = BaseMessageStrategy.promptCache.get(cacheKey);
    
    if (cached && cached.expires > Date.now()) {
      return cached.content;
    }
    
    const template = await this.promptRepository.getTemplate(key, organizationId);
    if (template) {
      BaseMessageStrategy.promptCache.set(cacheKey, { 
        content: template.content, 
        expires: Date.now() + BaseMessageStrategy.PROMPT_CACHE_TTL_MS 
      });
      return template.content;
    }
    return undefined;
  }

  protected async analyzeText(text: string, senderPhoneNumber: string): Promise<LLMAnalysisResult> {
     // Common logic for Prompt Fetching + Text Analysis with caching
     const organizationId = undefined; // Fallback to Global
     const promptKey = 'analyze_message'; 
     
     const systemPrompt = await this.getPromptCached(promptKey, organizationId);

     return this.llmProvider.analyzeText(text, { 
        context: { userPhone: senderPhoneNumber },
        systemPrompt: systemPrompt
    });
  }
}
