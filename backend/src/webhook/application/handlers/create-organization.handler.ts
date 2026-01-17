
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
                `✅ Félicitiations ! Votre organisation *${orgName}* a été créée.\n\nVous êtes maintenant l'Administrateur (Owner).\n\n🚀 *Commençons le tutoriel !*\n\n📝 *Étape 1/5* : Enregistrez votre première dépense.\n👉 Essayez d'envoyer : "Achat de 10 sacs de glace pour 5000"`
            );
        } catch (error) {
            await messagingService.sendMessage(senderPhoneNumber, "❌ Une erreur est survenue lors de la création de l'organisation.");
            console.error(error);
        }
    }
}
