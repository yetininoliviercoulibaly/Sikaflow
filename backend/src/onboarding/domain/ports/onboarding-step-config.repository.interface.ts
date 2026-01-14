import { OnboardingStepConfig } from '../onboarding-step-config.entity';
import { OnboardingStepId } from '../onboarding-progress.entity';

export const I_ONBOARDING_STEP_CONFIG_REPOSITORY = Symbol('I_ONBOARDING_STEP_CONFIG_REPOSITORY');

/**
 * Port interface for OnboardingStepConfig persistence.
 */
export interface IOnboardingStepConfigRepository {
  /**
   * Find all active steps for a specific plan (or base steps if planId is null).
   */
  findByPlanId(planId: string | null): Promise<OnboardingStepConfig[]>;

  /**
   * Find steps applicable to a plan (includes base steps + plan-specific).
   */
  findStepsForPlan(planId: string | null): Promise<OnboardingStepConfig[]>;

  /**
   * Find a specific step by its stepId.
   */
  findByStepId(stepId: OnboardingStepId): Promise<OnboardingStepConfig | null>;

  /**
   * Get all active steps ordered by order field.
   */
  findAllActive(): Promise<OnboardingStepConfig[]>;

  /**
   * Create a new step configuration.
   */
  create(config: OnboardingStepConfig): Promise<OnboardingStepConfig>;

  /**
   * Update an existing step configuration.
   */
  update(config: OnboardingStepConfig): Promise<OnboardingStepConfig>;
}
