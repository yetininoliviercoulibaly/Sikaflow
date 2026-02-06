/**
 * Unique identifier for each onboarding step.
 * Steps are ordered by priority for each role.
 */
export enum OnboardingStepId {
  WELCOME = 'WELCOME',
  CREATE_FIRST_TRANSACTION = 'CREATE_FIRST_TRANSACTION',
  TRACK_FIRST_DEBT = 'TRACK_FIRST_DEBT',
  ADD_TEAM_MEMBER = 'ADD_TEAM_MEMBER',
  GENERATE_REPORT = 'GENERATE_REPORT',
  SUBSCRIBE = 'SUBSCRIBE',
}

/**
 * Onboarding progress tracking for a user within an organization.
 * Pure POJO - no ORM decorators (Domain Purity Rule).
 */
export interface OnboardingProgress {
  id: string;
  userId: string;
  organizationId: string;
  role: string; // OWNER | MANAGER | STAFF
  completedSteps: OnboardingStepId[];
  currentStep: OnboardingStepId | null;
  startedAt: Date;
  completedAt: Date | null;
}

/**
 * Factory function to create a new OnboardingProgress.
 */
export function createOnboardingProgress(params: {
  id: string;
  userId: string;
  organizationId: string;
  role: string;
}): OnboardingProgress {
  return {
    id: params.id,
    userId: params.userId,
    organizationId: params.organizationId,
    role: params.role,
    completedSteps: [],
    currentStep: OnboardingStepId.WELCOME,
    startedAt: new Date(),
    completedAt: null,
  };
}
