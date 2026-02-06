import { Inject, Injectable } from '@nestjs/common';
import { IActionHandler, ActionContext } from './action-handler.interface';
import { IUserRepository, I_USER_REPOSITORY } from '../../../user/domain/ports/user.repository.interface';
import { IOrganizationRepository, I_ORGANIZATION_REPOSITORY } from '../../../organization/domain/ports/organization.repository.interface';
import { UserRole } from '../../../organization/domain/organization-member.entity';
import { LLMIntent } from '../../../common/llm/llm-types';
import { GetOrganizationFeaturesUseCase } from '../../../subscription/application/use-cases/get-organization-features.use-case';
import { FEATURE_DESCRIPTIONS } from '../../../subscription/domain/constants/feature-descriptions.constant';
import { AgentOrchestratorService } from '../../../agent/agent-orchestrator.service';

@Injectable()
export class HelpHandler implements IActionHandler {
    constructor(
        @Inject(I_USER_REPOSITORY) private readonly userRepository: IUserRepository,
        @Inject(I_ORGANIZATION_REPOSITORY) private readonly organizationRepository: IOrganizationRepository,
        private readonly getOrganizationFeaturesUseCase: GetOrganizationFeaturesUseCase,
        private readonly agentOrchestrator: AgentOrchestratorService,
    ) {}

    canHandle(intent: string): boolean {
        return intent === LLMIntent.HELP;
    }

    async handle(data: any, context: ActionContext): Promise<void> {
        const { senderPhoneNumber, organizationId, messagingService } = context;

        const user = await this.userRepository.findByPhoneNumber(senderPhoneNumber);
        const availableFeaturesList: string[] = [];
        let role = 'UNKNOWN';
        let planName = 'Aucun';

        if (!user || !user.lastActiveOrganizationId) {
            role = 'NEW_USER';
            availableFeaturesList.push("Créer une Organisation (Club)");
        } else {
            // Active Member Context
            const member = await this.organizationRepository.findMember(organizationId!, user.id);
            role = member?.role || UserRole.STAFF;
            const isManagerOrOwner = role === UserRole.OWNER || role === UserRole.MANAGER;

            // Dynamic Feature Retrieval
            const featureResult = await this.getOrganizationFeaturesUseCase.execute(organizationId!);
            planName = featureResult.planName;

            // Map features to readable strings
            featureResult.features.forEach(flag => {
                if (FEATURE_DESCRIPTIONS[flag]) {
                    availableFeaturesList.push(FEATURE_DESCRIPTIONS[flag]);
                }
            });

            // Management Specifics (Roles)
            if (isManagerOrOwner) {
                availableFeaturesList.push("Ajouter Membre");
                availableFeaturesList.push("Gérer Abonnement");
            }
        }

        // Construct structured context for the Agent
        const structuredContext = {
            user_role: role,
            subscription_plan: planName,
            available_features: availableFeaturesList,
            user_intent: "DEMANDE_AIDE"
        };

        const agentPrompt = `
        CONTEXTE STRICT (JSON):
        ${JSON.stringify(structuredContext, null, 2)}

        INSTRUCTIONS:
        Agis comme un guide expert SikaFlow.
        1. Accueille l'utilisateur selon son rôle (${role}).
        2. Présente les fonctionnalités DISPONIBLES (${availableFeaturesList.join(', ')}) de manière naturelle et fluide (pas de liste à puces robotique).
        3. Mentionne qu'il peut utiliser des notes vocales.
        `;

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
