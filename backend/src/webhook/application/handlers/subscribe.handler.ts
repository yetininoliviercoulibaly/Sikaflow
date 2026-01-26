
import { Injectable } from '@nestjs/common';
import { IActionHandler, ActionContext } from './action-handler.interface';
import { SubscribeUseCase } from '../../../subscription/application/use-cases/subscribe.use-case';
import { SubscriptionPlan } from '../../../subscription/domain/subscription-plan.entity';
import { LLMIntent } from '../../../common/llm/llm-types';
import { ConversationStateService } from '../services/conversation-state.service';

@Injectable()
export class SubscribeHandler implements IActionHandler {
  constructor(
    private readonly subscribeUseCase: SubscribeUseCase,
    private readonly conversationStateService: ConversationStateService,
  ) {}

  canHandle(intent: string): boolean {
    return intent === LLMIntent.SUBSCRIBE;
  }

  async handle(data: any, context: ActionContext): Promise<void> {
    const { senderPhoneNumber, organizationId, messagingService } = context;

    if (!organizationId) {
       await messagingService.sendMessage(senderPhoneNumber, '❌ Veuillez d\'abord sélectionner une organisation.');
       return;
    }

    const providerArg = data.provider?.toUpperCase(); // WAVE, STRIPE
    const durationArg = data.duration; // 3, 12, 'MONTHLY'

    if (providerArg) {
        // User specified a provider. Let's try to match a plan.
        const plans = await this.subscribeUseCase.getPlansData(providerArg);
        
        if (plans.length === 0) {
             await messagingService.sendMessage(senderPhoneNumber, `❌ Désolé, le paiement via ${providerArg} n'est pas disponible pour le moment.`);
             return;
        }

        let selectedPlan: SubscriptionPlan | null | undefined = null;
        
        // Try to fuzzy match duration
        if (durationArg) {
            let targetMonths =
                typeof durationArg === 'number' ? durationArg :
                durationArg === 'MONTHLY' ? 1 :
                durationArg === 'QUARTERLY' ? 3 :
                durationArg === 'YEARLY' ? 12 : null;

            // Try to parse string number if not yet resolved
            if (!targetMonths && !isNaN(Number(durationArg))) {
                 targetMonths = Number(durationArg);
            }

            if (targetMonths) {
                // Priority 1: Match duration directly
                selectedPlan = plans.find(p => p.durationMonths === targetMonths);

                // Priority 2: Match index (1-based)
                // If the user sends "1", it could mean "Option 1" or "1 Month".
                // Since "Option 1" is explicitly presented to the user, we should consider it.
                if (!selectedPlan && targetMonths > 0 && targetMonths <= plans.length) {
                    selectedPlan = plans[targetMonths - 1];
                }
            }
        }

        if (selectedPlan) {
            // DIRECT EXECUTION
             try {
                const { paymentLink } = await this.subscribeUseCase.execute(selectedPlan.id, organizationId);
                await messagingService.sendMessage(senderPhoneNumber, `💎 *Abonnement ${selectedPlan.name}*\n\nCliquez pour payer (${selectedPlan.price} ${selectedPlan.currency}) :\n${paymentLink}`);

                // Clear any pending action since we are done
                await this.conversationStateService.clearPendingAction(senderPhoneNumber);
            } catch (e) {
                await messagingService.sendMessage(senderPhoneNumber, "❌ Erreur lors de la création du lien.");
            }
            return;
        } else {
             // FALLBACK: Provider known, but Duration unknown or invalid. List Plans.
             let msg = `🔎 Nous avons plusieurs options pour *${providerArg}* :\n\n`;
             plans.forEach((p, index) => {
                 msg += `${index + 1}. *${p.name}* : ${p.price} ${p.currency} / ${p.durationMonths} mois\n`;
             });
             msg += `\nRépondez avec le numéro ou "3 mois".`;
             await messagingService.sendMessage(senderPhoneNumber, msg);

             // Set Pending Action so the next message (e.g. "1") is interpreted in context
             await this.conversationStateService.setPendingAction(senderPhoneNumber, {
                 intent: LLMIntent.SUBSCRIBE,
                 data: { provider: providerArg },
                 missing_fields: ['duration'],
                 createdAt: new Date()
             });
             return;
        }
    }

    // CONVERSATIONAL FLOW (No Provider specified)
    // Step 1: List Methods
    const methods = await this.subscribeUseCase.getPaymentMethods();
    let msg = `💳 *Choisissez un moyen de paiement* :\n\n`;
    methods.forEach((m, index) => {
        msg += `- *${m.code}* (${m.name})\n`;
    });
    msg += `\nExemple : "Abonnement Wave" ou "Abonnement 3 mois Wave"`;
    
    await messagingService.sendMessage(senderPhoneNumber, msg);

    // Set pending action for provider
    await this.conversationStateService.setPendingAction(senderPhoneNumber, {
         intent: LLMIntent.SUBSCRIBE,
         data: {},
         missing_fields: ['provider'],
         createdAt: new Date()
    });
  }
}
