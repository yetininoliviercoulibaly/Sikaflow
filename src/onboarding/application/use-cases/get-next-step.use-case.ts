import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnboardingStepId } from '../../domain/onboarding-progress.entity';
import { 
  IOnboardingRepository, 
  I_ONBOARDING_REPOSITORY 
} from '../../domain/ports/onboarding.repository.interface';
import { 
  IOnboardingStepConfigRepository,
  I_ONBOARDING_STEP_CONFIG_REPOSITORY,
} from '../../domain/ports/onboarding-step-config.repository.interface';
import { OnboardingStepConfig } from '../../domain/onboarding-step-config.entity';
import { 
  OnboardingStep, 
  getStepsForRole, 
  getStepById 
} from '../../domain/onboarding-step.value-object';

export interface GetNextStepInput {
  userId: string;
  organizationId: string;
  planId?: string | null;
}

export interface GetNextStepOutput {
  step: OnboardingStep | OnboardingStepConfig | null;
  currentStepNumber: number;
  totalSteps: number;
  isCompleted: boolean;
}

/**
 * UseCase: Get the next onboarding step for a user.
 * Fetches from database if available, falls back to static steps.
 */
@Injectable()
export class GetNextStepUseCase {
  private readonly logger = new Logger(GetNextStepUseCase.name);

  constructor(
    @Inject(I_ONBOARDING_REPOSITORY)
    private readonly onboardingRepository: IOnboardingRepository,
    @Inject(I_ONBOARDING_STEP_CONFIG_REPOSITORY)
    private readonly stepConfigRepository: IOnboardingStepConfigRepository,
  ) {}

  async execute(input: GetNextStepInput): Promise<GetNextStepOutput> {
    const { userId, organizationId, planId } = input;

    const progress = await this.onboardingRepository.findByUserAndOrganization(
      userId,
      organizationId,
    );

    if (!progress) {
      return {
        step: null,
        currentStepNumber: 0,
        totalSteps: 0,
        isCompleted: false,
      };
    }

    // Try to get steps from database first
    let steps: (OnboardingStep | OnboardingStepConfig)[] = [];
    try {
      const dbSteps = await this.stepConfigRepository.findStepsForPlan(planId || null);
      if (dbSteps.length > 0) {
        // Filter by role
        steps = dbSteps.filter(s => s.requiredRoles.includes(progress.role));
      }
    } catch (error) {
      this.logger.debug('No DB steps found, falling back to static steps');
    }

    // Fallback to static steps if no DB steps
    if (steps.length === 0) {
      steps = getStepsForRole(progress.role);
    }

    const totalSteps = steps.length;

    // If onboarding is completed
    if (progress.completedAt) {
      return {
        step: null,
        currentStepNumber: totalSteps,
        totalSteps,
        isCompleted: true,
      };
    }

    // Find current step
    if (progress.currentStep) {
      const currentStepIndex = steps.findIndex(s => {
        if ('stepId' in s) {
          return s.stepId === progress.currentStep;
        }
        return s.id === progress.currentStep;
      });
      
      if (currentStepIndex >= 0) {
        return {
          step: steps[currentStepIndex],
          currentStepNumber: currentStepIndex + 1,
          totalSteps,
          isCompleted: false,
        };
      }
    }

    // Default to first step
    return {
      step: steps[0] || null,
      currentStepNumber: 1,
      totalSteps,
      isCompleted: false,
    };
  }
}

