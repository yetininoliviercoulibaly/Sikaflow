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
        let userContextDescription = "";

        if (!user || !user.lastActiveOrganizationId) {
            userContextDescription = "User has NO active organization.";
            availableFeaturesList.push("Créer une Organisation (Club)");
        } else {
            // Active Member Context
            const member = await this.organizationRepository.findMember(organizationId!, user.id);
            const role = member?.role || UserRole.STAFF;
            const isManagerOrOwner = role === UserRole.OWNER || role === UserRole.MANAGER;

            userContextDescription = `User is ${role} of organization ${organizationId}.`;

            // Dynamic Feature Retrieval
            const { planName, features } = await this.getOrganizationFeaturesUseCase.execute(organizationId!);
            userContextDescription += ` Plan: ${planName}.`;

            // Map features to readable strings
            features.forEach(flag => {
                if (FEATURE_DESCRIPTIONS[flag]) {
                    availableFeaturesList.push(FEATURE_DESCRIPTIONS[flag]);
                }
            });

            // Management Specifics (Roles)
            if (isManagerOrOwner) {
                availableFeaturesList.push("Ajouter Membre");
                availableFeaturesList.push("Gérer Abonnement");
                if (!availableFeaturesList.includes("Créer Événement") && features.includes("STOCK_MANAGEMENT" as any)) {
                     availableFeaturesList.push("Créer Événement");
                }
            }
        }

        // Construct the Agent Prompt
        const agentPrompt = `L'utilisateur demande de l'aide (commande 'Aide').
        CONTEXTE UTILISATEUR: ${userContextDescription}
        FONCTIONNALITÉS ACTIVÉES POUR LUI: ${availableFeaturesList.join(', ')}.

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
