import { Inject, Injectable, Logger } from '@nestjs/common';
import { WhatsAppPayloadDto } from '../dtos/whatsapp-payload.dto';
import { IMessageStrategy, MESSAGE_STRATEGY_TOKEN } from '../strategies/message-strategy.interface';
import { IUserRepository, I_USER_REPOSITORY } from '../../../user/domain/ports/user.repository.interface';
import { WhatsAppMessagingAdapter } from '../../../common/messaging/whatsapp-messaging.adapter';
import { ActionExecutionService } from '../services/action-execution.service';
import { ConversationStateService } from '../services/conversation-state.service';
import { LLMIntent } from '../../../common/llm/llm-types';
import { MessagingPlatforms } from '../../../common/messaging/domain/constants/messaging-platforms.enum';

@Injectable()
export class ProcessMessageUseCase {
  private readonly logger = new Logger(ProcessMessageUseCase.name);

  constructor(
    @Inject(MESSAGE_STRATEGY_TOKEN)
    private readonly strategies: IMessageStrategy[],
    private readonly whatsAppMessagingAdapter: WhatsAppMessagingAdapter,
    @Inject(I_USER_REPOSITORY) private readonly userRepository: IUserRepository,
    private readonly actionExecutionService: ActionExecutionService,
    private readonly conversationState: ConversationStateService,
  ) {}

  async execute(payload: WhatsAppPayloadDto): Promise<void> {
    const entry = payload.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;
    const statuses = value?.statuses;
    
    if (statuses && statuses.length > 0) {
        this.logger.log(`Received status update from Meta: ${JSON.stringify(statuses)}`);
        return;
    }

    if (!messages || messages.length === 0) {
      this.logger.debug('No messages or statuses found in payload');
      return;
    }

    for (const message of messages) {
      const from = message.from; 
      const messageId = message.id;

      try {
        // 1. Find Strategy
        const strategy = this.strategies.find(s => s.canHandle(message));
        if (!strategy) {
             this.logger.warn(`No strategy found for message type: ${message.type}`);
             continue;
        }

        // Check for specific Regex patterns (Bypass LLM for Claim Links)
        let analysis: any = null;
        if (message.type === 'text' && message.text?.body?.startsWith('CLAIM-')) {
             analysis = {
                 intent: LLMIntent.CLAIM_TICKET,
                 data: { token: message.text.body },
                 actions: [{ intent: LLMIntent.CLAIM_TICKET, data: { raw_message: message.text.body } }]
             };
        } else {
             // 2. Process via Strategy (LLM)
             analysis = await strategy.process(message, from);
             
             // CONTEXT MERGE: Check for pending action and merge context (Same logic as Telegram)
             const pending = this.conversationState.getPendingAction(from);
             if (pending) {
               this.logger.log(`Merging pending context for ${from}: ${JSON.stringify(pending)}`);
                
               // Context Merging Logic
               // 1. If we have a pending intent, we generally trust it over the new analysis
               // unless the new analysis is a "CANCEL" or "STOP" command.
               const content = message.type === 'text' ? message.text?.body : '';
               const isStopCommand = content && ['STOP', 'ANNULER', 'CANCEL', 'EXIT'].includes(content.toUpperCase());
               
               if (!isStopCommand) {
                 const llmData = analysis.data || {};
                 
                 // Merge pending data with new LLM data (LLM data takes precedence for new fields)
                 const mergedData = { ...pending.data, ...llmData };
                 
                 // Determine remaining missing fields by checking if they now exist in mergedData
                 // We check if the value is not null/undefined/empty string
                 const remainingMissing = (pending.missing_fields || []).filter(field => {
                    const val = mergedData[field];
                    return val === undefined || val === null || val === '';
                 });
                 
                 analysis = {
                    intent: pending.intent,
                    data: mergedData,
                    actions: [{
                        intent: pending.intent,
                        data: mergedData,
                        missing_fields: remainingMissing
                    }]
                 };
                 
                 if (remainingMissing.length > 0) {
                     this.conversationState.setPendingAction(from, {
                         intent: pending.intent,
                         data: mergedData,
                         missing_fields: remainingMissing,
                         createdAt: new Date()
                     });
                 } else {
                     this.conversationState.clearPendingAction(from);
                 }
               } else {
                  this.conversationState.clearPendingAction(from);
               }
             }
        }
        
        if (!analysis) {
             this.logger.warn(`Analysis failed or was skipped via strategy for message ${messageId}`);
             continue;
        }
        
        this.logger.log(`Analysis for ${from}: ${JSON.stringify(analysis)}`);

        // 3. Normalize Actions
        const actions = analysis.actions || (analysis.intent ? [{ intent: analysis.intent, data: analysis.data }] : []);

        // 4. Fetch User
        const user = await this.userRepository.findByPhoneNumber(from);

        // 5. Execute Actions via Service
        await this.actionExecutionService.execute({
            actions,
            messagingService: this.whatsAppMessagingAdapter,
            user,
            senderPhoneNumber: from,
            messageId,
            messageBody: message.type === 'text' && message.text ? message.text.body : undefined,
            platform: MessagingPlatforms.WHATSAPP
        });

      } catch (error) {
        this.logger.error(`Error processing message ${messageId} from ${from}`, error);
      }
    }
  }
}
