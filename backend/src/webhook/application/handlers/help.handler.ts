
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IActionHandler, ActionContext } from './action-handler.interface';
import { IUserRepository, I_USER_REPOSITORY } from '../../../user/domain/ports/user.repository.interface';
import { IOrganizationRepository, I_ORGANIZATION_REPOSITORY } from '../../../organization/domain/ports/organization.repository.interface';
import { UserRole } from '../../../organization/domain/organization-member.entity';
import { LLMIntent } from '../../../common/llm/llm-types';
import { MessagingPlatforms } from '../../../common/messaging/domain/constants/messaging-platforms.enum';
import { IMessageSection } from '../../../common/messaging/messaging.service.interface';
import { CheckFeatureUseCase } from '../../../subscription/application/use-cases/check-feature.use-case';
import { FeatureFlag } from '../../../subscription/domain/feature-flag.enum';


@Injectable()
export class HelpHandler implements IActionHandler {
    constructor(
        @Inject(I_USER_REPOSITORY) private readonly userRepository: IUserRepository,
        @Inject(I_ORGANIZATION_REPOSITORY) private readonly organizationRepository: IOrganizationRepository,
        private readonly configService: ConfigService,
        private readonly checkFeatureUseCase: CheckFeatureUseCase,
    ) {}

    canHandle(intent: string): boolean {
        return intent === LLMIntent.HELP;
    }

    async handle(data: any, context: ActionContext): Promise<void> {
        const { senderPhoneNumber, organizationId, messagingService, platform } = context;

        const user = await this.userRepository.findByPhoneNumber(senderPhoneNumber);
        
        // 1. Initial Greetings (Text)
        const headerText = "🤖 *SikaFlow Aide*";
        let bodyText = "🎤 *Astuce :* Vous pouvez envoyer des notes vocales ou écrire naturellement (ex: '50€ pour le taxi') !\n\nSinon, voici les boutons actions :";

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

        // Section 1: Caisse
        sections.push({
            title: "Caisse",
            rows: [
                { id: 'CMD_TX_EXPENSE', title: 'Nouvelle Dépense', description: 'Enregistrer un achat' },
                { id: 'CMD_TX_INCOME', title: 'Nouvelle Recette', description: 'Enregistrer une entrée' },
            ]
        });

        // Section 2: Recouvrement
        sections.push({
            title: "Recouvrement",
            rows: [
                { id: 'CMD_ADD_DEBT', title: 'Ajouter Créance', description: 'Quelqu\'un me doit' },
                { id: 'CMD_LIST_DEBTS', title: 'Mes Créances', description: 'Qui me doit ?' },
                { id: 'CMD_LIST_CREDITS', title: 'Mes Dettes', description: 'Je dois combien ?' },
                { id: 'CMD_SETTLE_DEBT', title: 'Encaisser Paiement', description: 'Marquer un paiement' },
            ]
        });

        // Section 3: Gestion & Rapports (Manager/Owner)
        if (isManagerOrOwner) {
            const managementRows = [
                { id: 'CMD_REPORT_FLASH', title: 'Rapport Flash', description: 'Bilan immédiat' },
            ];

            // Check Advanced Reports
            const { hasAccess: hasAdvanced } = await this.checkFeatureUseCase.execute({
                organizationId: organizationId!, feature: FeatureFlag.ADVANCED_ANALYTICS
            });
            if (hasAdvanced) {
                managementRows.push({ id: 'CMD_REPORT_WEEK', title: 'Bilan Hebdo', description: 'Semaine écoulée' });
            }

            managementRows.push({ id: 'CMD_ADD_MEMBER', title: 'Ajouter Membre', description: 'Inviter du staff' });
            managementRows.push({ id: 'CMD_SUBSCRIBE', title: 'Abonnement', description: 'Gérer mon plan' });

            sections.push({
                title: "Gestion & Rapports",
                rows: managementRows
            });
        }


        // Send Platform Specific Format
        if (platform === MessagingPlatforms.WHATSAPP) {
            await messagingService.sendInteractiveList(
                senderPhoneNumber,
                headerText,
                bodyText, // Use the promo text
                "Afficher le Menu",
                sections
            );
        } else {
            // Telegram: Adapter converts List to Inline Keyboard automatically
            await messagingService.sendInteractiveList(
                senderPhoneNumber,
                headerText,
                bodyText, // Use the promo text
                "Menu", // Not used in TG but required by interface
                sections
            );
        }
    }
}
