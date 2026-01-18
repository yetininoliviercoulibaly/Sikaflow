
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IActionHandler, ActionContext } from './action-handler.interface';
import { CreateOrganizationUseCase } from '../../../organization/application/use-cases/create-organization.use-case';
import { LLMIntent } from '../../../common/llm/llm-types';

@Injectable()
export class CreateOrganizationHandler implements IActionHandler {
    constructor(
        private readonly createOrganizationUseCase: CreateOrganizationUseCase,
        private readonly configService: ConfigService,
    ) {}

    canHandle(intent: string): boolean {
        return intent === LLMIntent.CREATE_ORGANIZATION;
    }

    async handle(data: any, context: ActionContext): Promise<void> {
        const { senderPhoneNumber, messagingService } = context;
        const orgName = data.name;

        if (!orgName) {
            await messagingService.sendMessage(senderPhoneNumber, "Quel est le nom de votre établissement ? (ex: 'Créer le club Miami')");
            return;
        }

        try {
            await this.createOrganizationUseCase.execute({
                name: orgName,
                userPhoneNumber: senderPhoneNumber
            });

            const countryCode = this.configService.get<string>('DEFAULT_COUNTRY_CODE') || '+225';
            await messagingService.sendMessage(
                senderPhoneNumber,
                `✅ *Organisation "${orgName}" créée !*\n\n` +
                `Vous êtes maintenant Administrateur.\n\n` +
                `🚀 *C'est parti ! Vous pouvez tout de suite :*\n\n` +
                `🎤 *Envoyer une note vocale* (ex: "Vente de 5000 pour 2 tickets")\n` +
                `💬 *Ou écrire simplement :*\n` +
                `• "Vente 50 euros pour 2 Plats" (Enregistrez une vente)\n` +
                `• "Achat 1000 euros de Boissons" (Stock ou dépense)\n` +
                `• "Ajouter membre 0707070707 comme Staff" (Inviter votre équipe)\n\n` +
                `ℹ️ Tapez "Menu" ou "Aide" à tout moment pour voir les options.`
            );
        } catch (error) {
            await messagingService.sendMessage(senderPhoneNumber, "❌ Une erreur est survenue lors de la création de l'organisation.");
            console.error(error);
        }
    }
}
