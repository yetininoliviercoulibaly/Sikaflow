import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnboardingStepId } from '../../domain/onboarding-progress.entity';
import { 
  IOnboardingRepository, 
  I_ONBOARDING_REPOSITORY 
} from '../../domain/ports/onboarding.repository.interface';
import { 
  getStepsForRole, 
  getStepById,
  OnboardingStep,
} from '../../domain/onboarding-step.value-object';

export interface CompleteStepInput {
  userId: string;
  organizationId: string;
  stepId: OnboardingStepId;
}

export interface CompleteStepOutput {
  success: boolean;
  nextStep: OnboardingStep | null;
  isOnboardingCompleted: boolean;
  completionMessage: string;
}

/**
 * UseCase: Mark an onboarding step as completed.
 * Advances to the next step or marks onboarding as complete.
 */
@Injectable()
export class CompleteStepUseCase {
  private readonly logger = new Logger(CompleteStepUseCase.name);

  constructor(
    @Inject(I_ONBOARDING_REPOSITORY)
    private readonly onboardingRepository: IOnboardingRepository,
  ) {}

  async execute(input: CompleteStepInput): Promise<CompleteStepOutput> {
    const { userId, organizationId, stepId } = input;

    const progress = await this.onboardingRepository.findByUserAndOrganization(
      userId,
      organizationId,
    );

    if (!progress) {
      this.logger.warn(`No onboarding progress found for user ${userId}`);
      return {
        success: false,
        nextStep: null,
        isOnboardingCompleted: false,
        completionMessage: '',
      };
    }

    // Check if step was already completed
    if (progress.completedSteps.includes(stepId)) {
      this.logger.debug(`Step ${stepId} already completed for user ${userId}`);
      return {
        success: true,
        nextStep: null,
        isOnboardingCompleted: progress.completedAt !== null,
        completionMessage: '',
      };
    }

    // Add step to completed steps
    const completedStep = getStepById(stepId);
    progress.completedSteps.push(stepId);

    // Find next step
    const steps = getStepsForRole(progress.role);
    const currentIndex = steps.findIndex(s => s.id === stepId);
    const nextStep = steps[currentIndex + 1] || null;

    if (nextStep) {
      progress.currentStep = nextStep.id;
    } else {
      // All steps completed
      progress.currentStep = null;
      progress.completedAt = new Date();
    }

    await this.onboardingRepository.update(progress);

    return {
      success: true,
      nextStep,
      isOnboardingCompleted: progress.completedAt !== null,
      completionMessage: completedStep?.completionMessage || '',
    };
  }
}
