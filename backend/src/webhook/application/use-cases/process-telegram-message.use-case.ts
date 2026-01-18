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
import { CommandIntentMapper } from '../services/command-intent.mapper';
import { ConversationStateService } from '../services/conversation-state.service';

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
    private readonly commandIntentMapper: CommandIntentMapper,
    private readonly conversationState: ConversationStateService,
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

    // Map callback data to action
    const mapped = this.commandIntentMapper.map(data);
    
    if (!mapped) {
        this.logger.warn(`No mapping found for callback data: ${data}`);
        return;
    }

    // CONTEXT MERGE for Callbacks (Maintain state across button clicks)
    const pending = this.conversationState.getPendingAction(String(chatId));
    if (pending && mapped.intent === pending.intent) {
         this.logger.log(`Merging pending context for callback ${chatId}: ${JSON.stringify(pending)}`);
         mapped.data = { ...pending.data, ...mapped.data };
         
         // Update missing fields
         const stillMissing = (pending.missing_fields || []).filter(field => {
             const val = mapped.data[field];
             return val === undefined || val === null || val === '';
         });

         if (stillMissing.length === 0) {
             this.conversationState.clearPendingAction(String(chatId));
             mapped.missing_fields = [];
         } else {
             this.conversationState.updatePendingAction(String(chatId), mapped.data);
             mapped.missing_fields = stillMissing;
         }
    }

    const actions = [mapped];
    
    // Find user by Telegram ID
    const user = await this.userRepository.findByPhoneNumber(String(chatId));

    await this.actionExecutionService.execute({
        actions,
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
      let { type, content, fileId } = this.extractMessageContent(message);
      
      if (!content && !fileId) {
        this.logger.debug(`No processable content in message ${messageId}`);
        return;
      }

      // VOICE/AUDIO PROCESSING
      if (fileId && (type === 'voice' || type === 'audio')) {
          try {
             await this.telegramMessagingAdapter.sendMessage(String(chatId), "🎤 Traitement de l'audio en cours...");
             const { buffer } = await this.telegramMessagingAdapter.downloadMedia(fileId);
             
             const base64Audio = buffer.toString('base64');
             const mimeType = type === 'voice' ? 'audio/ogg' : 'audio/mpeg'; 
             
             const transcription = await this.llmProvider.transcribeAudio(base64Audio, mimeType);
             
             if (!transcription || transcription.toLowerCase().includes('audio unclear')) {
                 await this.telegramMessagingAdapter.sendMessage(String(chatId), "⚠️ Audio incompréhensible. Merci de répéter.");
                 return;
             }
             content = transcription;
             type = 'text'; // Treat as text henceforth
             this.logger.log(`Transcription result for ${userId}: "${content}"`);
          } catch (e) {
               this.logger.error(`Failed to process audio for ${userId}`, e);
               await this.telegramMessagingAdapter.sendMessage(String(chatId), "❌ Erreur lors du traitement de l'audio.");
               return;
          }
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
        // Resolve Analysis (Shared Logic via Helper)
        analysis = await this.resolveAnalysis(content, chatId, userId);
      } else {
        await this.telegramMessagingAdapter.sendMessage(
          String(chatId),
          "📝 Pour l'instant, je ne peux traiter que les messages texte ou audio.",
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


  private async resolveAnalysis(content: string, chatId: number, userId: number): Promise<LLMAnalysisResult> {
      const pending = this.conversationState.getPendingAction(String(chatId));
      let analysis = await this.analyzeText(content, String(userId), pending);
      
      if (!pending) return analysis;

      this.logger.log(`Merging pending context for ${chatId}: ${JSON.stringify(pending)}`);
      
      const isStopCommand = ['STOP', 'ANNULER', 'CANCEL', 'EXIT'].includes(content.toUpperCase());
      if (isStopCommand) {
        this.conversationState.clearPendingAction(String(chatId));
        return analysis;
      }

      const mergedData = this.applyHeuristics(content, pending, analysis.data || {});
      const remainingMissing = (pending.missing_fields || []).filter(field => {
        const val = mergedData[field];
        return val === undefined || val === null || val === '';
      });
      
      analysis = {
        intent: pending.intent,
        data: mergedData,
        actions: [{ intent: pending.intent, data: mergedData, missing_fields: remainingMissing }]
      };
      
      if (remainingMissing.length > 0) {
        this.conversationState.setPendingAction(String(chatId), {
          intent: pending.intent, data: mergedData, missing_fields: remainingMissing, createdAt: new Date()
        });
      } else {
        this.conversationState.clearPendingAction(String(chatId));
      }
      return analysis;
  }

  private applyHeuristics(content: string, pending: { intent: string, missing_fields?: string[], data: Record<string, unknown> }, llmData: Record<string, unknown>): Record<string, unknown> {
      const mergedData = { ...pending.data, ...llmData };
      const missingFields = pending.missing_fields || [];
      const lowerContent = content.toLowerCase();

      if (!mergedData['amount'] && missingFields.includes('amount')) {
          const extracted = this.extractAmountFromText(content);
          if (extracted !== null) mergedData['amount'] = extracted;
      }
      if (!mergedData['period'] && missingFields.includes('period')) {
          const extracted = this.extractPeriodFromText(lowerContent);
          if (extracted) mergedData['period'] = extracted;
      }
      if (!mergedData['metric'] && missingFields.includes('metric')) {
          const extracted = this.extractMetricFromText(lowerContent);
          if (extracted) mergedData['metric'] = extracted;
      }
      
      // Name heuristic: If name/event_name is missing, use raw message if it looks like a name
      const nameField = missingFields.includes('event_name') ? 'event_name' : (missingFields.includes('name') ? 'name' : null);
      if (nameField && !mergedData[nameField]) {
          const isNameIntent = [
              LLMIntent.CREATE_ORGANIZATION, 
              LLMIntent.CREATE_EVENT, 
              LLMIntent.GENERATE_CLAIM_LINKS
          ].includes(pending.intent as any);

          if (isNameIntent && content.length > 2 && content.length < 100 && !content.includes('/') && !/^\d+$/.test(content)) {
              mergedData[nameField] = this.cleanupName(content);
          }
      }

      return mergedData;
  }

  private cleanupName(text: string): string {
      const prefixes = [
          "le nom est ",
          "le nom de l'organisation est ",
          "le nom de l'événement est ",
          "l'événement s'appelle ",
          "l'organisation s'appelle ",
          "c'est ",
          "il s'appelle ",
          "c'est l'",
          "le nom c'est "
      ];
      let cleaned = text.trim();
      const lowerCleaned = cleaned.toLowerCase();
      
      for (const prefix of prefixes) {
          if (lowerCleaned.startsWith(prefix)) {
              cleaned = cleaned.substring(prefix.length).trim();
              
              // Remove optional articles at the start of the remaining name
              if (cleaned.toLowerCase().startsWith('le ')) cleaned = cleaned.substring(3);
              if (cleaned.toLowerCase().startsWith('la ')) cleaned = cleaned.substring(3);
              if (cleaned.toLowerCase().startsWith('l\'')) cleaned = cleaned.substring(2);
              
              break; 
          }
      }
      
      // Also remove trailing period if any
      if (cleaned.endsWith('.')) cleaned = cleaned.slice(0, -1);
      
      return cleaned.trim();
  }

  private extractAmountFromText(text: string): number | null {
      const match = text.match(/(\d+([.,]\d+)?)/);
      return match ? parseFloat(match[0].replace(',', '.')) : null;
  }

  private extractPeriodFromText(text: string): string | null {
      const periodMap: [string[], string][] = [
          [["aujourd'hui", "ce jour"], 'today'],
          [["hier"], 'yesterday'],
          [["cette semaine"], 'this_week'],
          [["mois dernier"], 'last_month'],
          [["ce mois"], 'this_month'],
          [["cette année"], 'this_year'],
          [["ce semestre"], 'this_semester'],
          [["semestre dernier"], 'last_semester'],
          [["ce trimestre"], 'this_quarter'],
          [["trimestre dernier"], 'last_quarter'],
      ];
      for (const [keywords, value] of periodMap) {
          if (keywords.some(k => text.includes(k))) return value;
      }
      return null;
  }

  private extractMetricFromText(text: string): string | null {
      const metricMap: [string[], string][] = [
          [["bénéfice", "profit", "bénéfices"], 'NET_PROFIT'],
          [["chiffre d'affaire", "revenus", "recettes", "ventes"], 'REVENUE'],
          [["dépenses", "charges", "frais", "coûts"], 'EXPENSES'],
          [["pourboire", "tips"], 'TIPS'],
          [["trésorerie", "cash flow", "flux de trésorerie"], 'CASH_FLOW'],
      ];
      for (const [keywords, value] of metricMap) {
          if (keywords.some(k => text.includes(k))) return value;
      }
      return null;
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

  private async analyzeText(text: string, userPhone: string, pendingAction?: any): Promise<LLMAnalysisResult> {
    const promptKey = 'analyze_message';
    const template = await this.promptRepository.getTemplate(promptKey);
    
    return this.llmProvider.analyzeText(text, {
      context: { 
          userPhone,
          pendingAction: pendingAction ? {
              intent: pendingAction.intent,
              missing_fields: pendingAction.missing_fields
          } : null
      },
      systemPrompt: template?.content,
    });
  }
}
