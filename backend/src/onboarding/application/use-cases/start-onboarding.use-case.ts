import { Inject, Injectable } from '@nestjs/common';
import { v4 } from 'uuid';
import { 
  OnboardingProgress, 
  OnboardingStepId, 
  createOnboardingProgress 
} from '../../domain/onboarding-progress.entity';
import { 
  IOnboardingRepository, 
  I_ONBOARDING_REPOSITORY 
} from '../../domain/ports/onboarding.repository.interface';
import { getStepsForRole } from '../../domain/onboarding-step.value-object';

export interface StartOnboardingInput {
  userId: string;
  organizationId: string;
  role: string;
}

export interface StartOnboardingOutput {
  progress: OnboardingProgress;
  isNew: boolean;
  totalSteps: number;
}

/**
 * UseCase: Start the onboarding process for a user.
 * Creates a new OnboardingProgress or returns existing one.
 */
@Injectable()
export class StartOnboardingUseCase {
  constructor(
    @Inject(I_ONBOARDING_REPOSITORY)
    private readonly onboardingRepository: IOnboardingRepository,
  ) {}

  async execute(input: StartOnboardingInput): Promise<StartOnboardingOutput> {
    const { userId, organizationId, role } = input;

    // Check if onboarding already exists for this user/org combination
    const existing = await this.onboardingRepository.findByUserAndOrganization(
      userId,
      organizationId,
    );

    if (existing) {
      const steps = getStepsForRole(role);
      return {
        progress: existing,
        isNew: false,
        totalSteps: steps.length,
      };
    }

    // Create new onboarding progress
    const progress = createOnboardingProgress({
      id: v4(),
      userId,
      organizationId,
      role,
    });

    const created = await this.onboardingRepository.create(progress);
    const steps = getStepsForRole(role);

    return {
      progress: created,
      isNew: true,
      totalSteps: steps.length,
    };
  }
}
