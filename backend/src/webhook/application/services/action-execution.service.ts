import { Inject, Injectable, Logger } from '@nestjs/common';
import { IActionHandler, ACTION_HANDLER_TOKEN, ActionContext } from '../handlers/action-handler.interface';
import { CheckSubscriptionUseCase } from '../../../subscription/application/use-cases/check-subscription.use-case';
import { IMessagingService } from '../../../common/messaging/messaging.service.interface';
import { User } from '../../../user/domain/user.entity';
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
    LLMIntent.HELP
  ];

  constructor(
    @Inject(ACTION_HANDLER_TOKEN)
    private readonly actionHandlers: IActionHandler[],
    private readonly checkSubscriptionUseCase: CheckSubscriptionUseCase,
  ) {}

  async execute(params: ActionExecutionParams): Promise<void> {
    const { actions, messagingService, user, senderPhoneNumber, messageId, messageBody, platform } = params;
    const organizationId = user?.lastActiveOrganizationId;

    for (const action of actions) {
      try {
        // 1. Check Subscription (unless bypassed)
        if (!this.BYPASS_INTENTS.includes(action.intent) && organizationId) {
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
             await messagingService.sendMessage(senderPhoneNumber, `Il manque des informations : ${action.missing_fields.join(', ')}. Pouvez-vous préciser ?`);
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
