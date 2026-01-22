import { Inject, Injectable, Logger } from '@nestjs/common';
import { UnifiedMessage, MessageType } from '../../domain/unified-message.interface';
import { LLMIntent, LLMAnalysisResult } from '../../../common/llm/llm-types';
import { IUserRepository, I_USER_REPOSITORY } from '../../../user/domain/ports/user.repository.interface';
import { IPromptRepository, I_PROMPT_REPOSITORY } from '../../../common/prompt/domain/ports/prompt.repository.interface';
import { ILLMProvider, LLM_PROVIDER_TOKEN } from '../../../common/llm/llm-provider.interface';
import { ActionExecutionService } from '../services/action-execution.service';
import { ConversationStateService } from '../services/conversation-state.service';
import { AgentOrchestratorService } from '../../../agent/agent-orchestrator.service';
import { MessageExtractionService } from '../services/message-extraction.service';
import { MediaStandardizationService } from '../services/media-standardization.service';
import { CommandIntentMapper } from '../services/command-intent.mapper';

@Injectable()
export class ProcessMessageUseCase {
  private readonly logger = new Logger(ProcessMessageUseCase.name);

  constructor(
    @Inject(I_USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(LLM_PROVIDER_TOKEN) private readonly llmProvider: ILLMProvider,
    @Inject(I_PROMPT_REPOSITORY) private readonly promptRepository: IPromptRepository,
    private readonly actionExecutionService: ActionExecutionService,
    private readonly conversationState: ConversationStateService,
    private readonly agentOrchestrator: AgentOrchestratorService,
    private readonly extractionService: MessageExtractionService,
    private readonly mediaService: MediaStandardizationService,
    private readonly commandIntentMapper: CommandIntentMapper,
  ) {}

  async execute(message: UnifiedMessage, messagingService: any): Promise<void> {
    const { senderId, platform, messageId, type } = message;
    let content = message.content || '';

    try {
      // 1. TRANSFORM MEDIA TO TEXT (if needed)
      if (message.fileId && (type === MessageType.VOICE || type === MessageType.AUDIO)) {
        await messagingService.sendMessage(senderId, "🎤 Traitement de l'audio en cours...");
        const transcription = await this.mediaService.transcribeAudio(message.fileId, type as any, messagingService);
        if (!transcription) {
          await messagingService.sendMessage(senderId, "⚠️ Audio incompréhensible. Merci de répéter.");
          return;
        }
        content = transcription;
      }

      // 2. FETCH USER CONTEXT
      const user = await this.userRepository.findByPhoneNumber(senderId);

      // 3. AGENTIC FLOW (if enabled)
      const isAgentEnabled = process.env.AGENT_ENABLED === 'true';
      if (isAgentEnabled && type !== MessageType.UNKNOWN) {
        this.logger.log(`Routing message ${messageId} to Agent for user ${senderId}`);
        const response = await this.agentOrchestrator.run(content, senderId, {
          phoneNumber: senderId,
          organizationId: user?.lastActiveOrganizationId || undefined
        });
        await messagingService.sendMessage(senderId, response);
        return;
      }

      // 4. LEGACY FLOW (LLM Analysis + Heuristics)
      let analysisResult = await this.resolveAnalysis(content, message, user);
      const analysis = analysisResult as any;

      if (!analysis || (analysis.intent === LLMIntent.UNKNOWN && !analysis.data)) {
        return;
      }

      const actions = analysis.actions || ((analysis as any).intent ? [{ intent: (analysis as any).intent, data: (analysis as any).data }] : []);

      if (actions.length === 0) {
        return;
      }

      await this.actionExecutionService.execute({
        actions,
        messagingService,
        user,
        senderPhoneNumber: senderId,
        messageId,
        messageBody: content,
        platform,
      });

    } catch (error) {
      this.logger.error(`Error processing message ${messageId} from ${senderId}`, error);
      await messagingService.sendMessage(senderId, "❌ Une erreur s'est produite lors du traitement.");
    }
  }

  private async resolveAnalysis(content: string, message: UnifiedMessage, user: any): Promise<LLMAnalysisResult | null> {
    const { senderId } = message;
    
    // Check for callback data first
    if (message.callbackData) {
        const mapped = this.commandIntentMapper.map(message.callbackData);
        if (mapped) {
            // Context merge for callbacks
            const pending = await this.conversationState.getPendingAction(senderId);
            if (pending && mapped.intent === pending.intent) {
                mapped.data = { ...pending.data, ...mapped.data };
                // ... same logic as before for missing fields
            }
            return { intent: mapped.intent as LLMIntent, data: mapped.data, actions: [mapped] };
        }
    }

    // Special CLAIM token regex
    if (content.startsWith('CLAIM-')) {
        return {
            intent: LLMIntent.CLAIM_TICKET,
            data: { token: content },
            actions: [{ intent: LLMIntent.CLAIM_TICKET, data: { raw_message: content } }]
        };
    }

    const pending = await this.conversationState.getPendingAction(senderId);
    let analysis = await this.analyzeText(content, senderId, pending);

    if (!pending) return analysis;

    const upperContent = content.toUpperCase();
    
    // Cancellation
    if (['STOP', 'ANNULER', 'CANCEL', 'EXIT', 'NON', 'RIEN'].includes(upperContent)) {
        await this.conversationState.clearPendingAction(senderId);
        return { intent: LLMIntent.UNKNOWN, data: {}, actions: [] };
    }

    // Help/Menu Break
    if (['AIDE', 'HELP', 'MENU'].includes(upperContent) || (analysis.intent === LLMIntent.HELP && (analysis.confidence || 0) > 0.8)) {
        await this.conversationState.clearPendingAction(senderId);
        return { intent: LLMIntent.HELP, data: {}, actions: [] };
    }

    // Smart Break (New High Confidence Intent)
    if (analysis.intent && analysis.intent !== LLMIntent.UNKNOWN && analysis.intent !== pending.intent) {
        if ((analysis.confidence || 0) >= 0.85) {
            await this.conversationState.clearPendingAction(senderId);
            return analysis;
        }
    }

    // Heuristics Merge
    const mergedData = this.extractionService.applyHeuristics(content, pending, analysis.data || {});
    const remainingFields = (pending.missing_fields || []).filter(f => !mergedData[f]);

    analysis = {
        intent: pending.intent as LLMIntent,
        data: mergedData,
        actions: [{ intent: pending.intent, data: mergedData, missing_fields: remainingFields }]
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

  private async analyzeText(text: string, senderId: string, pending?: any): Promise<LLMAnalysisResult> {
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
