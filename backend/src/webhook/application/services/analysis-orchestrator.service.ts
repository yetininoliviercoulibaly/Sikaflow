import { Inject, Injectable, Logger } from '@nestjs/common';
import { MessageEntity } from '../../domain/message.entity';
import { LLMIntent, LLMAnalysisResult } from '../../../common/llm/llm-types';
import { IPromptRepository, I_PROMPT_REPOSITORY } from '../../../common/prompt/domain/ports/prompt.repository.interface';
import { ILLMProvider, LLM_PROVIDER_TOKEN } from '../../../common/llm/llm-provider.interface';
import { ConversationStateService, PendingAction } from './conversation-state.service';
import { IntentResolverService } from './intent-resolver.service';
import { CommandIntentMapper } from './command-intent.mapper';
import { MessageExtractionService } from './message-extraction.service';
import { User } from '../../../user/domain/user.entity';

@Injectable()
export class AnalysisOrchestratorService {
  private readonly logger = new Logger(AnalysisOrchestratorService.name);

  constructor(
    @Inject(LLM_PROVIDER_TOKEN) private readonly llmProvider: ILLMProvider,
    @Inject(I_PROMPT_REPOSITORY) private readonly promptRepository: IPromptRepository,
    private readonly conversationState: ConversationStateService,
    private readonly intentResolver: IntentResolverService,
    private readonly commandIntentMapper: CommandIntentMapper,
    private readonly extractionService: MessageExtractionService,
  ) {}

  async resolveAnalysis(content: string, message: MessageEntity, user: User | null): Promise<LLMAnalysisResult | null> {
    const { senderId } = message;
    
    // 1. Resolve Heuristic/Magic Intent (STOP, CLAIM-, HELP)
    const heuristicAnalysis = this.intentResolver.resolveHeuristicIntent(content);
    if (heuristicAnalysis) {
      if (heuristicAnalysis.intent === LLMIntent.UNKNOWN || heuristicAnalysis.intent === LLMIntent.HELP) {
        await this.conversationState.clearPendingAction(senderId);
      }
      return heuristicAnalysis;
    }

    // 2. Check for callback data
    if (message.callbackData) {
        const mapped = this.commandIntentMapper.map(message.callbackData);
        if (mapped) {
            const pending = await this.conversationState.getPendingAction(senderId);
            if (pending && mapped.intent === pending.intent) {
                mapped.data = { ...pending.data, ...mapped.data };
            }
            return { 
                intent: mapped.intent, 
                data: mapped.data, 
                actions: [mapped] 
            };
        }
    }

    // 3. Normal LLM Analysis
    const pending = await this.conversationState.getPendingAction(senderId);
    let analysis = await this.analyzeText(content, senderId, pending || undefined);

    if (!pending) return analysis;

    // 4. Smart Break/Override logic
    const pendingIntent = pending.intent;
    if (this.intentResolver.shouldOverridePending(analysis, pendingIntent)) {
      await this.conversationState.clearPendingAction(senderId);
      return analysis;
    }

    // 5. Heuristics Merge
    const mergedData = this.extractionService.applyHeuristics(content, pending, analysis.data || {});
    const remainingFields = (pending.missing_fields || []).filter(f => !mergedData[f]);

    analysis = {
        intent: pendingIntent,
        data: mergedData,
        actions: [{ intent: pendingIntent, data: mergedData, missing_fields: remainingFields }]
    };

    if (remainingFields.length > 0) {
        await this.conversationState.setPendingAction(senderId, {
            ...pending, data: mergedData, missing_fields: remainingFields, createdAt: new Date()
        });
    } else {
        await this.conversationState.clearPendingAction(senderId);
    }

    return analysis;
  }

  private async analyzeText(text: string, senderId: string, pending?: PendingAction): Promise<LLMAnalysisResult> {
    const template = await this.promptRepository.getTemplate('analyze_message');
    return this.llmProvider.analyzeText(text, {
      context: { 
        userPhone: senderId,
        pendingAction: pending ? { intent: pending.intent, missing_fields: pending.missing_fields } : null
      },
      systemPrompt: template?.content,
    });
  }
}
