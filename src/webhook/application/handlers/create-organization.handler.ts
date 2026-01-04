
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IActionHandler, ActionContext } from './action-handler.interface';
import { WhatsAppService } from '../../../common/whatsapp/whatsapp.service';
import { CreateOrganizationUseCase } from '../../../organization/application/use-cases/create-organization.use-case';

@Injectable()
export class CreateOrganizationHandler implements IActionHandler {
    constructor(
        private readonly createOrganizationUseCase: CreateOrganizationUseCase,
        private readonly whatsAppService: WhatsAppService,
        private readonly configService: ConfigService,
    ) {}

    canHandle(intent: string): boolean {
        return intent === 'CREATE_ORGANIZATION';
    }

    async handle(data: any, context: ActionContext): Promise<void> {
        const { senderPhoneNumber } = context;
        const orgName = data.name;

        if (!orgName) {
            await this.whatsAppService.sendMessage(senderPhoneNumber, "Quel est le nom de votre établissement ? (ex: 'Créer le club Miami')");
            return;
        }

        try {
            await this.createOrganizationUseCase.execute({
                name: orgName,
                userPhoneNumber: senderPhoneNumber
            });

            const countryCode = this.configService.get<string>('DEFAULT_COUNTRY_CODE') || '+225';
            await this.whatsAppService.sendMessage(
                senderPhoneNumber,
                `✅ Félicitiations ! Votre organisation *${orgName}* a été créée.\n\nVous êtes maintenant l'Administrateur (Owner).\n\n🚀 Prochaines étapes :\n1. Ajoutez votre équipe : "Ajoute ${countryCode}... comme Manager"\n2. Activez votre accès : "Abonnement"`
            );
        } catch (error) {
            await this.whatsAppService.sendMessage(senderPhoneNumber, "❌ Une erreur est survenue lors de la création de l'organisation.");
            console.error(error);
        }
    }
}
