import { Injectable, Inject } from '@nestjs/common';
import { IActionHandler } from './action-handler.interface';
import { SubscribeMonthlyUseCase } from '../../../subscription/application/use-cases/subscribe-monthly.use-case';
import { IWhatsAppService, I_WHATSAPP_SERVICE } from '../../../common/whatsapp/whatsapp.service.interface';
import { IOrganizationRepository, I_ORGANIZATION_REPOSITORY } from '../../../organization/domain/ports/organization.repository.interface';

@Injectable()
export class SubscribeMonthlyHandler implements IActionHandler {
  constructor(
    private readonly subscribeUseCase: SubscribeMonthlyUseCase,
    @Inject(I_WHATSAPP_SERVICE) private readonly whatsAppService: IWhatsAppService,
    @Inject(I_ORGANIZATION_REPOSITORY) private readonly organizationRepository: IOrganizationRepository,
  ) {}

  canHandle(intent: string): boolean {
    return intent === 'SUBSCRIBE_MONTHLY';
  }

  async handle(data: any, context: any): Promise<void> {
    const { senderPhoneNumber, organizationId } = context;

    if (!organizationId) {
       await this.whatsAppService.sendMessage(senderPhoneNumber, '❌ Veuillez d\'abord sélectionner une organisation.');
       return;
    }

    try {
        const result = await this.subscribeUseCase.execute(organizationId, 'whatsapp');
        
        await this.whatsAppService.sendMessage(
            senderPhoneNumber, 
            `💎 *Abonnement Mensuel*\n\nCliquez ci-dessous pour activer votre abonnement et bénéficier d'un accès illimité :\n\n${result.paymentLink}\n\nUne fois le paiement effectué, votre accès sera immédiatement activé.`
        );
    } catch (e) {
        await this.whatsAppService.sendMessage(senderPhoneNumber, 'Désolé, impossible de générer le lien de paiement pour le moment.');
    }
  }
}
