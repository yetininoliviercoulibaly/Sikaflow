
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IActionHandler, ActionContext } from './action-handler.interface';
import { IUserRepository, I_USER_REPOSITORY } from '../../../user/domain/ports/user.repository.interface';
import { IOrganizationRepository, I_ORGANIZATION_REPOSITORY } from '../../../organization/domain/ports/organization.repository.interface';
import { UserRole } from '../../../organization/domain/organization-member.entity';
import { LLMIntent } from '../../../common/llm/llm-types';
import { MessagingPlatforms } from '../../../common/messaging/domain/constants/messaging-platforms.enum';
import { IMessageSection } from '../../../common/messaging/messaging.service.interface';

@Injectable()
export class HelpHandler implements IActionHandler {
    constructor(
        @Inject(I_USER_REPOSITORY) private readonly userRepository: IUserRepository,
        @Inject(I_ORGANIZATION_REPOSITORY) private readonly organizationRepository: IOrganizationRepository,
        private readonly configService: ConfigService,
    ) {}

    canHandle(intent: string): boolean {
        return intent === LLMIntent.HELP;
    }

    async handle(data: any, context: ActionContext): Promise<void> {
        const { senderPhoneNumber, organizationId, messagingService, platform } = context;

        const user = await this.userRepository.findByPhoneNumber(senderPhoneNumber);
        
        // 1. Initial Greetings (Text)
        const headerText = "🤖 *Event-Pilot Aide*";
        let bodyText = "Voici les commandes disponibles :";

        if (!user || !user.lastActiveOrganizationId) {
            // New User Context
            bodyText = "Bienvenue ! Pour commencer, vous devez créer ou rejoindre une organisation.";
            
            if (platform === MessagingPlatforms.WHATSAPP) {
                 await messagingService.sendInteractiveButtons(
                     senderPhoneNumber,
                     bodyText,
                     [
                         { id: 'CREATE_ORG_CMD', title: 'Créer un Club' },
                         { id: 'HELP_CMD', title: 'Aide' }
                     ]
                 );
            } else {
                 // Telegram - Simple Text fallback or same buttons
                 await messagingService.sendInteractiveButtons(
                     senderPhoneNumber,
                     bodyText,
                     [
                         { id: 'CREATE_ORG_CMD', title: 'Créer un Club' },
                         { id: 'HELP_CMD', title: 'Aide' }
                     ]
                 );
            }
            return;
        }

        // Active Member Context
        const member = await this.organizationRepository.findMember(organizationId!, user.id);
        const role = member?.role || UserRole.STAFF;
        const isManagerOrOwner = role === UserRole.OWNER || role === UserRole.MANAGER;

        // Build Sections for Interactive List
        const sections: IMessageSection[] = [];

        // Section 1: Opérations Courantes
        sections.push({
            title: "Opérations",
            rows: [
                { id: 'CMD_TX_EXPENSE', title: 'Nouvelle Dépense', description: 'Enregistrer un achat' },
                { id: 'CMD_TX_INCOME', title: 'Nouvelle Recette', description: 'Enregistrer une entrée' },
                { id: 'CMD_INCIDENT', title: 'Signaler Incident', description: 'Sécurité / Problème' }
            ]
        });

        // Section 2: Management (Conditional)
        if (isManagerOrOwner) {
            sections.push({
                title: "Gestion & Rapports",
                rows: [
                    { id: 'CMD_REPORT_FLASH', title: 'Rapport Flash', description: 'Bilan immédiat' },
                    { id: 'CMD_REPORT_WEEK', title: 'Bilan Hebdo', description: 'Semaine écoulée' },
                    { id: 'CMD_ADD_MEMBER', title: 'Ajouter Membre', description: 'Inviter du staff' }
                ]
            });
        }

        // Section 3: Ticketing
        sections.push({
            title: "Billetterie",
            rows: [
                { id: 'CMD_SCAN', title: 'Scanner Billet', description: 'Valider une entrée' },
                { id: 'CMD_STOCK', title: 'Voir Stock', description: 'Places restantes' }
            ]
        });


        // Send Platform Specific Format
        if (platform === MessagingPlatforms.WHATSAPP) {
            await messagingService.sendInteractiveList(
                senderPhoneNumber,
                headerText,
                "Sélectionnez une action ci-dessous :",
                "Afficher le Menu",
                sections
            );
        } else {
            // Telegram: Adapter converts List to Inline Keyboard automatically
            await messagingService.sendInteractiveList(
                senderPhoneNumber,
                headerText,
                "Appuyez sur un bouton pour lancer une action :",
                "Menu", // Not used in TG but required by interface
                sections
            );
        }
    }
}
