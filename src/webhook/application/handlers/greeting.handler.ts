
import { Inject, Injectable, Logger } from '@nestjs/common';
import { IActionHandler, ActionContext } from './action-handler.interface';
import { WhatsAppService } from '../../../common/whatsapp/whatsapp.service';
import { IUserRepository, I_USER_REPOSITORY } from '../../../user/domain/ports/user.repository.interface';
import { IOrganizationRepository, I_ORGANIZATION_REPOSITORY } from '../../../organization/domain/ports/organization.repository.interface';
import { StartOnboardingUseCase } from '../../../onboarding/application/use-cases/start-onboarding.use-case';
import { GetNextStepUseCase } from '../../../onboarding/application/use-cases/get-next-step.use-case';
import { FeatureGuard } from '../../../common/guards/feature.guard';
import { FeatureFlag } from '../../../subscription/domain/feature-flag.enum';

@Injectable()
export class GreetingHandler implements IActionHandler {
    private readonly logger = new Logger(GreetingHandler.name);

    constructor(
        private readonly whatsAppService: WhatsAppService,
        @Inject(I_USER_REPOSITORY) private readonly userRepository: IUserRepository,
        @Inject(I_ORGANIZATION_REPOSITORY) private readonly organizationRepository: IOrganizationRepository,
        private readonly startOnboardingUseCase: StartOnboardingUseCase,
        private readonly getNextStepUseCase: GetNextStepUseCase,
        private readonly featureGuard: FeatureGuard,
    ) {}

    canHandle(intent: string): boolean {
        return intent === 'GREETING';
    }

    async handle(data: any, context: ActionContext): Promise<void> {
        const { senderPhoneNumber, organizationId } = context;

        const user = await this.userRepository.findByPhoneNumber(senderPhoneNumber);

        if (user && user.lastActiveOrganizationId) {
            // Check if onboarding feature is enabled and auto-trigger
            const hasOnboarding = await this.featureGuard.canAccess(
                user.lastActiveOrganizationId,
                FeatureFlag.ONBOARDING_AGENT,
            );

            if (hasOnboarding) {
                // Get member role
                const member = await this.organizationRepository.findMember(
                    user.lastActiveOrganizationId,
                    user.id,
                );
                const role = member?.role || 'STAFF';

                // Start onboarding if not already done
                const startResult = await this.startOnboardingUseCase.execute({
                    userId: user.id,
                    organizationId: user.lastActiveOrganizationId,
                    role,
                });

                // Get next step
                const nextStep = await this.getNextStepUseCase.execute({
                    userId: user.id,
                    organizationId: user.lastActiveOrganizationId,
                });

                if (nextStep.step && !nextStep.isCompleted) {
                    const tipMessage = 'tipMessage' in nextStep.step ? nextStep.step.tipMessage : '';
                    await this.whatsAppService.sendMessage(
                        senderPhoneNumber,
                        `👋 Re-bonjour !\n\n📝 *Étape ${nextStep.currentStepNumber}/${nextStep.totalSteps}*\n\n${tipMessage}`,
                    );
                    return;
                }
            }

            await this.whatsAppService.sendMessage(
                senderPhoneNumber,
                `👋 Re-bonjour ! \n\nVous êtes connecté à votre organisation active.\n\nEnvoyez "Aide" pour voir les commandes disponibles.`,
            );
        } else {
            await this.whatsAppService.sendMessage(
                senderPhoneNumber,
                `👋 Bonjour et bienvenue sur Event-Pilot !\n\nJe suis votre assistant pour gérer votre établissement.\n\nJe ne trouve pas encore d'organisation liée à votre numéro.\n👉 Pour commencer, envoyez : "Créer le club [Nom]" (ex: Créer le club Miami 225)`,
            );
        }
    }
}

