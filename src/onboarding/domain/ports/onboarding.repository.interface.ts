import { OnboardingProgress } from '../onboarding-progress.entity';

export const I_ONBOARDING_REPOSITORY = Symbol('I_ONBOARDING_REPOSITORY');

/**
 * Port interface for OnboardingProgress persistence.
 * Implemented by MikroORM adapter in Infrastructure layer.
 */
export interface IOnboardingRepository {
  /**
   * Find onboarding progress by user ID.
   */
  findByUserId(userId: string): Promise<OnboardingProgress | null>;

  /**
   * Find all onboarding progress records for an organization.
   * Used for adoption reports.
   */
  findByOrganizationId(organizationId: string): Promise<OnboardingProgress[]>;

  /**
   * Create a new onboarding progress record.
   */
  create(progress: OnboardingProgress): Promise<OnboardingProgress>;

  /**
   * Update an existing onboarding progress record.
   */
  update(progress: OnboardingProgress): Promise<OnboardingProgress>;

  /**
   * Find progress by user and organization.
   */
  findByUserAndOrganization(
    userId: string,
    organizationId: string,
  ): Promise<OnboardingProgress | null>;
}
