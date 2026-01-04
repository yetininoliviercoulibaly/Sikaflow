import { Inject, Injectable, Logger } from '@nestjs/common';
import { WhatsAppPayloadDto } from '../dtos/whatsapp-payload.dto';
import { IMessageStrategy, MESSAGE_STRATEGY_TOKEN } from '../strategies/message-strategy.interface';
import { IActionHandler, ACTION_HANDLER_TOKEN } from '../handlers/action-handler.interface';
import { WhatsAppService } from '../../../common/whatsapp/whatsapp.service';
import { CheckSubscriptionUseCase } from '../../../subscription/application/use-cases/check-subscription.use-case';
import { IUserRepository, I_USER_REPOSITORY } from '../../../user/domain/ports/user.repository.interface';

@Injectable()
export class ProcessMessageUseCase {
  private readonly logger = new Logger(ProcessMessageUseCase.name);

  // Intents that bypass subscription check (allow users to activate pass)
  private readonly BYPASS_INTENTS = ['ACTIVATE_EVENT_PASS', 'UNKNOWN', 'GREETING', 'CREATE_ORGANIZATION', 'HELP'];

  constructor(
    @Inject(MESSAGE_STRATEGY_TOKEN)
    private readonly strategies: IMessageStrategy[],
    @Inject(ACTION_HANDLER_TOKEN)
    private readonly actionHandlers: IActionHandler[],
    private readonly whatsAppService: WhatsAppService,
    private readonly checkSubscriptionUseCase: CheckSubscriptionUseCase,
    @Inject(I_USER_REPOSITORY) private readonly userRepository: IUserRepository,
  ) {}

  async execute(payload: WhatsAppPayloadDto): Promise<void> {
    const entry = payload.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;

    if (!messages || messages.length === 0) {
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
                 intent: 'CLAIM_TICKET',
                 data: { token: message.text.body }, // We don't parse it fully here, usage in handler
                 actions: [{ intent: 'CLAIM_TICKET', data: { raw_message: message.text.body } }]
             };
        } else {
             // 2. Process via Strategy (LLM)
             analysis = await strategy.process(message, from);
        }
        
        if (!analysis) {
             this.logger.warn(`Analysis failed or was skipped via strategy for message ${messageId}`);
             continue;
        }
        
        this.logger.log(`Analysis for ${from}: ${JSON.stringify(analysis)}`);

        // 3. Normalize Actions
        const actions = analysis.actions || (analysis.intent ? [{ intent: analysis.intent, data: analysis.data }] : []);

        // US.13: Pre-check subscription status (before handlers)
        const user = await this.userRepository.findByPhoneNumber(from);
        const organizationId = user?.lastActiveOrganizationId;

        for (const action of actions) {
            // Skip subscription check for bypass intents
            if (!this.BYPASS_INTENTS.includes(action.intent) && organizationId) {
                const access = await this.checkSubscriptionUseCase.execute({ organizationId });
                if (!access.hasAccess) {
                    await this.whatsAppService.sendMessage(
                        from,
                        "⛔ Accès expiré. Activez un Pass Événement (48h) ou un Abonnement pour continuer.\n\n👉 Envoyez \"Activer pass\" pour débloquer l'accès."
                    );
                    continue; // Skip this action
                }
            }

            // Check for Missing Fields
            if (action.missing_fields && action.missing_fields.length > 0) {
                 await this.whatsAppService.sendMessage(from, `Il manque des informations : ${action.missing_fields.join(', ')}. Pouvez-vous préciser ?`);
                 continue; 
            }

            // Handle Context Switch
            if (action.organization_name) {
                 this.logger.log(`Context switch requested to: ${action.organization_name}`);
            }

            // 4. Delegate to Action Handler
            const handler = this.actionHandlers.find(h => h.canHandle(action.intent));
            if (handler) {
                await handler.handle(action.data, {
                    senderPhoneNumber: from,
                    organizationId: organizationId || null,
                    messageId: messageId,
                    messageBody: message.type === 'text' && message.text ? message.text.body : undefined,
                    missingFields: action.missing_fields,
                    language: user?.preferredLanguage || 'fr',
                    user: user, // Pass pre-fetched user to avoid duplicate DB lookups
                });
            } else {
                this.logger.warn(`No handler found for intent: ${action.intent}`);
            }
        }
      } catch (error) {
        this.logger.error(`Error processing message ${messageId} from ${from}`, error);
      }
    }
  }
}
