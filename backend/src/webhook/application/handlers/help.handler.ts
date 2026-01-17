
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

        // Section 1: Opérations Courantes
        sections.push({
            title: "Opérations",
            rows: [
                { id: 'CMD_TX_EXPENSE', title: 'Nouvelle Dépense', description: 'Enregistrer un achat' },
                { id: 'CMD_TX_INCOME', title: 'Nouvelle Recette', description: 'Enregistrer une entrée' },

            ]
        });

        // 1.1 Check Incident Feature
        const { hasAccess: hasIncident } = await this.checkFeatureUseCase.execute({ 
            organizationId: organizationId!, feature: FeatureFlag.INCIDENT_COMPLIANCE 
        });
        if (hasIncident) {
            sections[0].rows.push({ id: 'CMD_INCIDENT', title: 'Signaler Incident', description: 'Sécurité / Problème' });
        }

        // 1.2 Add Subscribe Button directly to Operations (or separate?) - Putting it in 'Gestion' or 'Opérations'
        // User requested "Abonnement" to be visible. Let's add it to "Opérations" if not Premium? Or always?
        // Let's add it to a "Compte" section or append to Operations for visibility in MVP.
        // Actually, let's look at where it best fits. Often "Compte" or "Abonnement".
        // Let's put it in "Opérations" for MVP visibility or a new "Mon Compte" Section.
        // Given constraints, I'll add it to "Gestion & Rapports" or start a new section if Manager.
        const subscriptionRow = { id: 'CMD_SUBSCRIBE', title: 'Abonnement', description: 'Gérer mon plan' };

        // Section 2: Management (Conditional)
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
            managementRows.push(subscriptionRow); // Add Subscribe here

            sections.push({
                title: "Gestion & Rapports",
                rows: managementRows
            });
        }

        // Section 3: Ticketing (Stock)
        const { hasAccess: hasStock } = await this.checkFeatureUseCase.execute({ 
            organizationId: organizationId!, feature: FeatureFlag.STOCK_MANAGEMENT 
        });

        if (hasStock) {
            sections.push({
                title: "Billetterie",
                rows: [
                    { id: 'CMD_SCAN', title: 'Scanner Billet', description: 'Valider une entrée' },
                    { id: 'CMD_STOCK', title: 'Voir Stock', description: 'Places restantes' }
                ]
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
