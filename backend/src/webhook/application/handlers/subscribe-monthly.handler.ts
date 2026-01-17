import { Injectable, Inject } from '@nestjs/common';
import { IActionHandler, ActionContext } from './action-handler.interface';
import { SubscribeMonthlyUseCase } from '../../../subscription/application/use-cases/subscribe-monthly.use-case';
import { IOrganizationRepository, I_ORGANIZATION_REPOSITORY } from '../../../organization/domain/ports/organization.repository.interface';
import { LLMIntent } from '../../../common/llm/llm-types';

@Injectable()
export class SubscribeMonthlyHandler implements IActionHandler {
  constructor(
    private readonly subscribeUseCase: SubscribeMonthlyUseCase,
    @Inject(I_ORGANIZATION_REPOSITORY) private readonly organizationRepository: IOrganizationRepository,
  ) {}

  canHandle(intent: string): boolean {
    return intent === LLMIntent.SUBSCRIBE_MONTHLY;
  }

  async handle(data: any, context: ActionContext): Promise<void> {
    const { senderPhoneNumber, organizationId, messagingService, platform } = context;

    if (!organizationId) {
       await messagingService.sendMessage(senderPhoneNumber, '❌ Veuillez d\'abord sélectionner une organisation.');
       return;
    }

    try {
        const result = await this.subscribeUseCase.execute(organizationId, platform);
        
        await messagingService.sendMessage(
            senderPhoneNumber, 
            `💎 *Abonnement Mensuel*\n\nCliquez ci-dessous pour activer votre abonnement et bénéficier d'un accès illimité :\n\n${result.paymentLink}\n\nUne fois le paiement effectué, votre accès sera immédiatement activé.`
        );
    } catch (e) {
        await messagingService.sendMessage(senderPhoneNumber, 'Désolé, impossible de générer le lien de paiement pour le moment.');
    }
  }
}
