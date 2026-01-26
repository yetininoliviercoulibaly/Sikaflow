import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IActionHandler, ActionContext } from './action-handler.interface';
import { IUserRepository, I_USER_REPOSITORY } from '../../../user/domain/ports/user.repository.interface';
import { IOrganizationRepository, I_ORGANIZATION_REPOSITORY } from '../../../organization/domain/ports/organization.repository.interface';
import { UserRole } from '../../../organization/domain/organization-member.entity';
import { LLMIntent } from '../../../common/llm/llm-types';
import { CheckFeatureUseCase } from '../../../subscription/application/use-cases/check-feature.use-case';
import { FeatureFlag } from '../../../subscription/domain/feature-flag.enum';
import { AgentOrchestratorService } from '../../../agent/agent-orchestrator.service';

@Injectable()
export class HelpHandler implements IActionHandler {
    constructor(
        @Inject(I_USER_REPOSITORY) private readonly userRepository: IUserRepository,
        @Inject(I_ORGANIZATION_REPOSITORY) private readonly organizationRepository: IOrganizationRepository,
        private readonly configService: ConfigService,
        private readonly checkFeatureUseCase: CheckFeatureUseCase,
        private readonly agentOrchestrator: AgentOrchestratorService,
    ) {}

    canHandle(intent: string): boolean {
        return intent === LLMIntent.HELP;
    }

    async handle(data: any, context: ActionContext): Promise<void> {
        const { senderPhoneNumber, organizationId, messagingService } = context;

        const user = await this.userRepository.findByPhoneNumber(senderPhoneNumber);
        const availableFeatures: string[] = [];
        let userContextDescription = "";

        if (!user || !user.lastActiveOrganizationId) {
            userContextDescription = "User has NO active organization.";
            availableFeatures.push("Créer une Organisation (Club)");
        } else {
            // Active Member Context
            const member = await this.organizationRepository.findMember(organizationId!, user.id);
            const role = member?.role || UserRole.STAFF;
            const isManagerOrOwner = role === UserRole.OWNER || role === UserRole.MANAGER;

            userContextDescription = `User is ${role} of organization ${organizationId}.`;

            // Basic Operations
            availableFeatures.push("Nouvelle Dépense");
            availableFeatures.push("Nouvelle Recette");

            // Incident
            const { hasAccess: hasIncident } = await this.checkFeatureUseCase.execute({
                organizationId: organizationId!, feature: FeatureFlag.INCIDENT_COMPLIANCE
            });
            if (hasIncident) {
                availableFeatures.push("Signaler Incident");
            }

            // Subscription
            availableFeatures.push("Gérer Abonnement");

            // Management
            if (isManagerOrOwner) {
                availableFeatures.push("Rapport Flash");

                const { hasAccess: hasAdvanced } = await this.checkFeatureUseCase.execute({
                    organizationId: organizationId!, feature: FeatureFlag.ADVANCED_ANALYTICS
                });
                if (hasAdvanced) {
                    availableFeatures.push("Bilan Hebdo");
                }

                availableFeatures.push("Ajouter Membre");
            }

            // Ticketing
            const { hasAccess: hasStock } = await this.checkFeatureUseCase.execute({
                organizationId: organizationId!, feature: FeatureFlag.STOCK_MANAGEMENT
            });

            if (hasStock) {
                availableFeatures.push("Scanner Billet");
                availableFeatures.push("Voir Stock");

                if (isManagerOrOwner) {
                    availableFeatures.push("Créer Événement");
                }
            }
        }

        // Construct the Agent Prompt
        // We act as if the user asked for help, but we inject the context of what they CAN do.
        const agentPrompt = `L'utilisateur demande de l'aide (commande 'Aide').
        CONTEXTE UTILISATEUR: ${userContextDescription}
        FONCTIONNALITÉS ACTIVÉES POUR LUI: ${availableFeatures.join(', ')}.

        Tâche : Explique à l'utilisateur ce qu'il peut faire. Sois accueillant. Rappelle-lui qu'il peut utiliser des notes vocales.
        Ne liste pas les fonctionnalités sous forme de puces ennuyeuses, fais une phrase naturelle si possible, ou une liste engageante.`;

        // Delegate to Agent
        const response = await this.agentOrchestrator.run(
            agentPrompt,
            senderPhoneNumber,
            {
                phoneNumber: senderPhoneNumber,
                organizationId: organizationId || undefined
            }
        );

        await messagingService.sendMessage(senderPhoneNumber, response);
    }
}
