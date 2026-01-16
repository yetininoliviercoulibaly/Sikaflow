import { Inject, Injectable, Logger } from '@nestjs/common';
import { TelegramUpdateDto, TelegramMessageDto } from '../dtos/telegram-payload.dto';
import { LLMAnalysisResult } from '../strategies/message-strategy.interface';
import { LLMIntent } from '../../../common/llm/llm-types';
import { MessagingPlatforms } from '../../../common/messaging/domain/constants/messaging-platforms.enum';
import { IUserRepository, I_USER_REPOSITORY } from '../../../user/domain/ports/user.repository.interface';
import { ILLMProvider, LLM_PROVIDER_TOKEN } from '../../../common/llm/llm-provider.interface';
import { IPromptRepository, I_PROMPT_REPOSITORY } from '../../../common/prompt/domain/ports/prompt.repository.interface';
import { TelegramMessagingAdapter } from '../../../common/messaging/telegram-messaging.adapter';
import { ActionExecutionService } from '../services/action-execution.service';

/**
 * Use case for processing incoming Telegram messages
 * Mirrors ProcessMessageUseCase for WhatsApp but adapted for Telegram's data structures
 */
@Injectable()
export class ProcessTelegramMessageUseCase {
  private readonly logger = new Logger(ProcessTelegramMessageUseCase.name);

  constructor(
    private readonly telegramMessagingAdapter: TelegramMessagingAdapter,
    @Inject(I_USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(LLM_PROVIDER_TOKEN) private readonly llmProvider: ILLMProvider,
    @Inject(I_PROMPT_REPOSITORY) private readonly promptRepository: IPromptRepository,
    private readonly actionExecutionService: ActionExecutionService,
  ) {}

  async execute(update: TelegramUpdateDto): Promise<void> {
    // Handle callback queries (button presses)
    if (update.callback_query) {
      await this.handleCallbackQuery(update);
      return;
    }

    // Handle regular messages
    if (update.message) {
      await this.handleMessage(update.message);
    }
  }

  private async handleCallbackQuery(update: TelegramUpdateDto): Promise<void> {
    const callbackQuery = update.callback_query!;
    const chatId = callbackQuery.message?.chat.id;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;

    this.logger.log(`Callback query from ${userId}: ${data}`);

    if (!chatId || !data) return;

    // Process callback data as an action
    // Format expected: INTENT:param1:param2
    const [intent, ...params] = data.split(':');
    
    // Find user by Telegram ID
    const user = await this.userRepository.findByPhoneNumber(String(chatId));

    await this.actionExecutionService.execute({
        actions: [{ intent, data: { params } }],
        messagingService: this.telegramMessagingAdapter,
        user,
        senderPhoneNumber: String(chatId),
        messageId: callbackQuery.id,
        platform: MessagingPlatforms.TELEGRAM,
    });
  }

  private async handleMessage(message: TelegramMessageDto): Promise<void> {
    const chatId = message.chat.id;
    const userId = message.from?.id;
    const messageId = message.message_id;

    if (!userId) {
      this.logger.warn('Message without user ID');
      return;
    }

    try {
      // Determine message type and extract content
      const { type, content, fileId } = this.extractMessageContent(message);
      
      if (!content && !fileId) {
        this.logger.debug(`No processable content in message ${messageId}`);
        return;
      }

      // Special handling for CLAIM tokens
      let analysis: LLMAnalysisResult;
      if (type === 'text' && content?.startsWith('CLAIM-')) {
        analysis = {
          intent: LLMIntent.CLAIM_TICKET,
          data: { token: content },
          actions: [{ intent: LLMIntent.CLAIM_TICKET, data: { raw_message: content } }],
        };
      } else if (type === 'text' && content) {
        // Analyze via LLM
        analysis = await this.analyzeText(content, String(userId));
      } else {
        // For non-text messages, we might want specific handling
        await this.telegramMessagingAdapter.sendMessage(
          String(chatId),
          "📝 Pour l'instant, je ne peux traiter que les messages texte. Merci de m'envoyer du texte.",
        );
        return;
      }

      this.logger.log(`Analysis for Telegram user ${userId}: ${JSON.stringify(analysis)}`);

      // Normalize actions
      const actions = analysis.actions || (analysis.intent ? [{ intent: analysis.intent, data: analysis.data }] : []);

      // Fetch User
      const user = await this.userRepository.findByPhoneNumber(String(chatId));

      // Execute via Service
      await this.actionExecutionService.execute({
          actions,
          messagingService: this.telegramMessagingAdapter,
          user,
          senderPhoneNumber: String(chatId),
          messageId: String(messageId),
          messageBody: content,
          platform: MessagingPlatforms.TELEGRAM,
      });

    } catch (error) {
      this.logger.error(`Error processing Telegram message ${messageId}`, error);
      await this.telegramMessagingAdapter.sendMessage(
        String(chatId),
        "❌ Une erreur s'est produite lors du traitement de votre message. Veuillez réessayer.",
      );
    }
  }

  private extractMessageContent(message: TelegramMessageDto): {
    type: 'text' | 'photo' | 'document' | 'voice' | 'audio' | 'unknown';
    content?: string;
    fileId?: string;
  } {
    if (message.text) {
      return { type: 'text', content: message.text };
    }
    if (message.photo && message.photo.length > 0) {
      const largestPhoto = message.photo[message.photo.length - 1];
      return { type: 'photo', fileId: largestPhoto.file_id, content: message.caption };
    }
    if (message.document) {
      return { type: 'document', fileId: message.document.file_id, content: message.caption };
    }
    if (message.voice) {
      return { type: 'voice', fileId: message.voice.file_id };
    }
    if (message.audio) {
      return { type: 'audio', fileId: message.audio.file_id };
    }
    return { type: 'unknown' };
  }

  private async analyzeText(text: string, userPhone: string): Promise<LLMAnalysisResult> {
    const promptKey = 'analyze_message';
    const template = await this.promptRepository.getTemplate(promptKey);
    
    return this.llmProvider.analyzeText(text, {
      context: { userPhone },
      systemPrompt: template?.content,
    });
  }
}
