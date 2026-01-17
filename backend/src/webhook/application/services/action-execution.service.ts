import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IActionHandler, ACTION_HANDLER_TOKEN, ActionContext } from '../handlers/action-handler.interface';
import { CheckSubscriptionUseCase } from '../../../subscription/application/use-cases/check-subscription.use-case';
import { IMessagingService } from '../../../common/messaging/messaging.service.interface';
import { User } from '../../../user/domain/user.entity';
import { ConversationalGuidanceService } from './conversational-guidance.service';
import { ConversationStateService } from './conversation-state.service';
import { LLMIntent } from '../../../common/llm/llm-types';
import { MessagingPlatforms } from '../../../common/messaging/domain/constants/messaging-platforms.enum';

export interface ActionExecutionParams {
  actions: any[];
  messagingService: IMessagingService;
  user: User | null;
  senderPhoneNumber: string;
  messageId: string;
  messageBody?: string;
  platform: MessagingPlatforms;
}

@Injectable()
export class ActionExecutionService {
  private readonly logger = new Logger(ActionExecutionService.name);
  
  // Intents that bypass subscription check
  private readonly BYPASS_INTENTS = [
    LLMIntent.ACTIVATE_EVENT_PASS,
    LLMIntent.UNKNOWN,
    LLMIntent.GREETING,
    LLMIntent.CREATE_ORGANIZATION,
    LLMIntent.ACTIVATE_EVENT_PASS,
    LLMIntent.UNKNOWN,
    LLMIntent.GREETING,
    LLMIntent.CREATE_ORGANIZATION,
    LLMIntent.HELP,
    LLMIntent.SUBSCRIBE,
    LLMIntent.SUBSCRIBE_MONTHLY
  ];

  constructor(
    @Inject(ACTION_HANDLER_TOKEN)
    private readonly actionHandlers: IActionHandler[],
    private readonly checkSubscriptionUseCase: CheckSubscriptionUseCase,
    private readonly configService: ConfigService,
    private readonly guidanceService: ConversationalGuidanceService,
    private readonly conversationState: ConversationStateService,
  ) {}

  async execute(params: ActionExecutionParams): Promise<void> {
    const { actions, messagingService, user, senderPhoneNumber, messageId, messageBody, platform } = params;
    const organizationId = user?.lastActiveOrganizationId;

    for (const action of actions) {
      try {
        // 1. Check Subscription (unless bypassed)
        const bypassSubscriptionConfig = this.configService.get('BYPASS_SUBSCRIPTION_CHECK') === 'true';
        if (!bypassSubscriptionConfig && !this.BYPASS_INTENTS.includes(action.intent) && organizationId) {
            const access = await this.checkSubscriptionUseCase.execute({ organizationId });
            if (!access.hasAccess) {
                await messagingService.sendMessage(
                    senderPhoneNumber,
                    "⛔ Accès expiré. Activez un Pass Événement (48h) ou un Abonnement pour continuer.\n\n👉 Envoyez \"Activer pass\" pour débloquer l'accès."
                );
                continue;
            }
        }

        // 2. Check Missing Fields
        if (action.missing_fields && action.missing_fields.length > 0) {
             const firstField = action.missing_fields[0];
             const guidance = this.guidanceService.getGuidance(action.intent, firstField, platform, action.data);
             
             // Store pending action so we can merge context when user responds
             this.conversationState.setPendingAction(senderPhoneNumber, {
               intent: action.intent,
               data: action.data || {},
               missing_fields: action.missing_fields,
               createdAt: new Date(),
             });
             
             if (guidance.buttons && guidance.buttons.length > 0) {
                 await messagingService.sendInteractiveButtons(
                     senderPhoneNumber,
                     guidance.message,
                     guidance.buttons
                 );
             } else {
                 await messagingService.sendMessage(senderPhoneNumber, guidance.message);
             }
             continue; 
        }

        // 3. Handle Context Switch Logging
        if (action.organization_name) {
             this.logger.log(`Context switch requested to: ${action.organization_name}`);
        }

        // 4. Build Action Context
        const actionContext: ActionContext = {
            senderPhoneNumber,
            organizationId: organizationId || null,
            messageId,
            messageBody,
            missingFields: action.missing_fields,
            language: user?.preferredLanguage || 'fr',
            user,
            platform,
            messagingService,
        };

        // 5. Find and Execute Handler
        const handler = this.actionHandlers.find(h => h.canHandle(action.intent));
        if (handler) {
            await handler.handle(action.data || {}, actionContext);
            // Proactively clear pending action if handled successfully
            if (!action.missing_fields || action.missing_fields.length === 0) {
                this.conversationState.clearPendingAction(senderPhoneNumber);
            }
        } else {
            this.logger.warn(`No handler found for intent: ${action.intent}`);
        }

      } catch (error) {
        this.logger.error(`Error executing action ${action.intent} for ${senderPhoneNumber}`, error);
        await messagingService.sendMessage(senderPhoneNumber, "❌ Une erreur s'est produite lors du traitement de l'action.");
      }
    }
  }
}
