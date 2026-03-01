import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MessageEntity, MessageType } from '../../domain/message.entity';
import { LLMIntent } from '../../../common/llm/llm-types';
import { IUserRepository, I_USER_REPOSITORY } from '../../../user/domain/ports/user.repository.interface';
import { ActionExecutionService } from '../services/action-execution.service';
import { AgentOrchestratorService } from '../../../agent/agent-orchestrator.service';
import { MediaStandardizationService } from '../services/media-standardization.service';
import { IMessagingService } from '../../../common/messaging/messaging.service.interface';
import { AnalysisOrchestratorService } from '../services/analysis-orchestrator.service';
import { WEBHOOK_MESSAGES } from '../../domain/constants/webhook.constants';
import { User } from '../../../user/domain/user.entity';

@Injectable()
export class ProcessUnifiedMessageUseCase {
  private readonly logger = new Logger(ProcessUnifiedMessageUseCase.name);

  constructor(
    @Inject(I_USER_REPOSITORY) private readonly userRepository: IUserRepository,
    private readonly actionExecutionService: ActionExecutionService,
    private readonly agentOrchestrator: AgentOrchestratorService,
    private readonly mediaService: MediaStandardizationService,
    private readonly analysisOrchestrator: AnalysisOrchestratorService,
    private readonly configService: ConfigService,
  ) {}

  async execute(message: MessageEntity, messagingService: IMessagingService): Promise<void> {
    const { senderId, platform, messageId, type } = message;
    let content = message.content || '';

    try {
      // 1. TRANSFORM MEDIA TO TEXT (if needed)
      if (message.fileId && (type === MessageType.VOICE || type === MessageType.AUDIO)) {
        await messagingService.sendMessage(senderId, WEBHOOK_MESSAGES.PROCESSING_AUDIO);
        
        // Download media FIRST
        const media = await messagingService.downloadMedia(message.fileId);

        // Use proper enum types for transcription
        const mediaType = type === MessageType.VOICE ? MessageType.VOICE : MessageType.AUDIO;
        const transcription = await this.mediaService.transcribeAudio(media.buffer, mediaType);
        
        if (!transcription) {
          await messagingService.sendMessage(senderId, WEBHOOK_MESSAGES.AUDIO_UNINTELLIGIBLE);
          return;
        }
        content = transcription;
      }

      // 2. FETCH USER CONTEXT
      const user: User | null = await this.userRepository.findByIdentifier(senderId);

      // 3. AGENTIC FLOW (if enabled)
      const isAgentEnabled = this.configService.get<string>('AGENT_ENABLED') === 'true';
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
      const analysis = await this.analysisOrchestrator.resolveAnalysis(content, message, user);

      if (!analysis) {
        return;
      }

      const actions = analysis.actions;

      if (actions.length === 0) {
        // Fallback if intent exists but actions don't
        if (analysis.intent && analysis.intent !== LLMIntent.UNKNOWN) {
          actions.push({
            intent: analysis.intent,
            data: analysis.data || {}
          });
        } else {
          return;
        }
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
      await messagingService.sendMessage(senderId, WEBHOOK_MESSAGES.PROCESSING_ERROR);
    }
  }
}
