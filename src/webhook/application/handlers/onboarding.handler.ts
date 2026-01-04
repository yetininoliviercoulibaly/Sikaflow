import { Inject, Injectable, Logger } from '@nestjs/common';
import { IActionHandler, ActionContext } from './action-handler.interface';
import { WhatsAppService } from '../../../common/whatsapp/whatsapp.service';
import { FeatureGuard } from '../../../common/guards/feature.guard';
import { FeatureFlag } from '../../../subscription/domain/feature-flag.enum';
import { IUserRepository, I_USER_REPOSITORY } from '../../../user/domain/ports/user.repository.interface';
import { IOrganizationRepository, I_ORGANIZATION_REPOSITORY } from '../../../organization/domain/ports/organization.repository.interface';
import { StartOnboardingUseCase } from '../../../onboarding/application/use-cases/start-onboarding.use-case';
import { GetNextStepUseCase } from '../../../onboarding/application/use-cases/get-next-step.use-case';
import { GetAdoptionReportUseCase } from '../../../onboarding/application/use-cases/get-adoption-report.use-case';
import { LLMIntent } from '../../../common/llm/llm-types';

@Injectable()
export class OnboardingHandler implements IActionHandler {
  private readonly logger = new Logger(OnboardingHandler.name);

  constructor(
    private readonly whatsAppService: WhatsAppService,
    private readonly featureGuard: FeatureGuard,
    @Inject(I_USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(I_ORGANIZATION_REPOSITORY) private readonly organizationRepository: IOrganizationRepository,
    private readonly startOnboardingUseCase: StartOnboardingUseCase,
    private readonly getNextStepUseCase: GetNextStepUseCase,
    private readonly getAdoptionReportUseCase: GetAdoptionReportUseCase,
  ) {}

  canHandle(intent: string): boolean {
    return [
      LLMIntent.START_ONBOARDING,
      LLMIntent.ONBOARDING_NEXT,
      LLMIntent.ADOPTION_REPORT,
    ].includes(intent as LLMIntent);
  }

  async handle(data: any, context: ActionContext): Promise<void> {
    const { senderPhoneNumber, organizationId } = context;

    // Check if feature is enabled for this organization
    if (organizationId) {
      const hasAccess = await this.featureGuard.canAccess(
        organizationId,
        FeatureFlag.ONBOARDING_AGENT,
      );

      if (!hasAccess) {
        await this.whatsAppService.sendMessage(
          senderPhoneNumber,
          `⚡ *Fonctionnalité Premium*\n\n` +
          `Le tutoriel interactif n'est pas inclus dans votre plan actuel.\n\n` +
          `👉 Envoyez "Abonnement" pour découvrir nos offres Premium.`,
        );
        return;
      }
    }

    const intent = data.intent as LLMIntent;

    switch (intent) {
      case LLMIntent.START_ONBOARDING:
      case LLMIntent.ONBOARDING_NEXT:
        await this.handleOnboardingFlow(senderPhoneNumber, organizationId);
        break;
      case LLMIntent.ADOPTION_REPORT:
        await this.handleAdoptionReport(senderPhoneNumber, organizationId);
        break;
      default:
        await this.handleOnboardingFlow(senderPhoneNumber, organizationId);
    }
  }

  private async handleOnboardingFlow(
    senderPhoneNumber: string,
    organizationId: string | null,
  ): Promise<void> {
    const user = await this.userRepository.findByPhoneNumber(senderPhoneNumber);
    
    if (!user || !organizationId) {
      await this.whatsAppService.sendMessage(
        senderPhoneNumber,
        `👋 Bienvenue ! Pour commencer le tutoriel, vous devez d'abord créer une organisation.\n\n` +
        `👉 Envoyez : "Créer le club [Nom]"`,
      );
      return;
    }

    // Get member role
    const member = await this.organizationRepository.findMember(organizationId, user.id);
    const role = member?.role || 'STAFF';

    // Start or get existing onboarding
    const startResult = await this.startOnboardingUseCase.execute({
      userId: user.id,
      organizationId,
      role,
    });

    // Get next step
    const nextStepResult = await this.getNextStepUseCase.execute({
      userId: user.id,
      organizationId,
    });

    if (nextStepResult.isCompleted) {
      await this.whatsAppService.sendMessage(
        senderPhoneNumber,
        `🎊 *Tutoriel terminé !*\n\n` +
        `Vous maîtrisez maintenant Event-Pilot.\n\n` +
        `Envoyez "Aide" pour voir toutes les commandes disponibles.`,
      );
      return;
    }

    if (nextStepResult.step) {
      const stepInfo = `📝 *Étape ${nextStepResult.currentStepNumber}/${nextStepResult.totalSteps}*\n\n`;
      await this.whatsAppService.sendMessage(
        senderPhoneNumber,
        stepInfo + nextStepResult.step.tipMessage,
      );
    }
  }

  private async handleAdoptionReport(
    senderPhoneNumber: string,
    organizationId: string | null,
  ): Promise<void> {
    if (!organizationId) {
      await this.whatsAppService.sendMessage(
        senderPhoneNumber,
        `❌ Vous devez être connecté à une organisation pour voir le rapport d'adoption.`,
      );
      return;
    }

    const report = await this.getAdoptionReportUseCase.execute(organizationId);

    let message = `📊 *Rapport d'Adoption de l'Équipe*\n\n`;
    message += `👥 Membres formés : ${report.completedMembers}/${report.totalMembers}\n`;
    message += `📈 Progression moyenne : ${report.averageProgress}%\n\n`;

    if (report.memberDetails.length > 0) {
      message += `*Détails par membre :*\n`;
      for (const member of report.memberDetails) {
        const status = member.isCompleted ? '✅' : '🔄';
        message += `${status} ${member.role}: ${member.progressPercent}%\n`;
      }
    }

    await this.whatsAppService.sendMessage(senderPhoneNumber, message);
  }
}
