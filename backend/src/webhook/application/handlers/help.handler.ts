
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IActionHandler, ActionContext } from './action-handler.interface';
import { IUserRepository, I_USER_REPOSITORY } from '../../../user/domain/ports/user.repository.interface';
import { IOrganizationRepository, I_ORGANIZATION_REPOSITORY } from '../../../organization/domain/ports/organization.repository.interface';
import { UserRole } from '../../../organization/domain/organization-member.entity';

@Injectable()
export class HelpHandler implements IActionHandler {
    constructor(
        @Inject(I_USER_REPOSITORY) private readonly userRepository: IUserRepository,
        @Inject(I_ORGANIZATION_REPOSITORY) private readonly organizationRepository: IOrganizationRepository,
        private readonly configService: ConfigService,
    ) {}

    canHandle(intent: string): boolean {
        return intent === 'HELP';
    }

    async handle(data: any, context: ActionContext): Promise<void> {
        const { senderPhoneNumber, organizationId, messagingService } = context;

        const user = await this.userRepository.findByPhoneNumber(senderPhoneNumber);
        
        let message = `🤖 *Event-Pilot Helpdesk* 🤖\n\n`;

        if (!user || !user.lastActiveOrganizationId) {
            // New User Context
            message += `Bienvenue ! Voici comment démarrer :\n\n`;
            message += `🏢 *Création*\n- "Créer le club [Nom]" : Pour créer votre établissement\n`;
            message += `🆘 *Aide*\n- "Aide" : Afficher ce menu\n`;
        } else {
            // Active Member Context
            const member = await this.organizationRepository.findMember(organizationId!, user.id);
            const role = member?.role || UserRole.STAFF;

            message += `Rôle détecté : *${role}*\n\n`;
            
            message += `📝 *Opérations*\n`;
            message += `- "J'ai dépensé 50€ pour les glaces" (Transaction)\n`;
            message += `- "Recette de 500€ entrée" (Revenu)\n`;
            message += `- Photo d'un incident (Rapport Sécurité)\n\n`;

            if (role === UserRole.OWNER || role === UserRole.MANAGER) {
                const countryCode = this.configService.get<string>('DEFAULT_COUNTRY_CODE') || '+225';
                message += `👥 *Gestion Équipe*\n`;
                message += `- "Ajoute le ${countryCode}... comme Staff"\n`;
                message += `- "Ajoute le ${countryCode}... comme Manager"\n\n`;
                
                message += `📊 *Rapports*\n`;
                message += `- "Rapport Flash" : Bilan immédiat\n`;
                message += `- "Rapport Hebdo" : Bilan semaine\n`;
                message += `- "Chiffre d'affaire hier ?" : Question précise\n`;
            }

            if (role === UserRole.OWNER) {
                 message += `💎 *Abonnement*\n`;
                 message += `- "Abonnement" : Gérer votre pass/abo\n`;
            }
        }

        await messagingService.sendMessage(senderPhoneNumber, message);
    }
}
