import { OnboardingStepId } from './onboarding-progress.entity';

/**
 * Configuration for an onboarding step stored in database.
 * Allows dynamic step management per subscription plan.
 * Pure POJO - no ORM decorators (Domain Purity Rule).
 */
export interface OnboardingStepConfig {
  id: string;
  stepId: OnboardingStepId;
  planId: string | null; // null = applies to all plans (base steps)
  title: string;
  description: string;
  tipMessage: string;
  completionMessage: string;
  requiredRoles: string[]; // OWNER, MANAGER, STAFF
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Factory function to create a new OnboardingStepConfig.
 */
export function createOnboardingStepConfig(params: {
  id: string;
  stepId: OnboardingStepId;
  planId: string | null;
  title: string;
  description: string;
  tipMessage: string;
  completionMessage: string;
  requiredRoles: string[];
  order: number;
}): OnboardingStepConfig {
  return {
    ...params,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
