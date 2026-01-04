import { Injectable } from '@nestjs/common';
import { FeatureFlag } from '../../subscription/domain/feature-flag.enum';
import { CheckFeatureUseCase } from '../../subscription/application/use-cases/check-feature.use-case';

/**
 * Guard for checking feature access based on organization's subscription plan.
 * Can be injected into handlers to control access to premium features.
 */
@Injectable()
export class FeatureGuard {
  constructor(private readonly checkFeatureUseCase: CheckFeatureUseCase) {}

  /**
   * Check if an organization has access to a specific feature.
   * @param organizationId The organization to check
   * @param feature The feature flag to validate
   * @returns true if access is granted, false otherwise
   */
  async canAccess(organizationId: string, feature: FeatureFlag): Promise<boolean> {
    if (!organizationId) {
      return false;
    }

    const result = await this.checkFeatureUseCase.execute({
      organizationId,
      feature,
    });

    return result.hasAccess;
  }

  /**
   * Check access and return detailed information about the plan.
   */
  async checkAccessWithDetails(
    organizationId: string,
    feature: FeatureFlag,
  ): Promise<{ hasAccess: boolean; planName?: string }> {
    if (!organizationId) {
      return { hasAccess: false };
    }

    return this.checkFeatureUseCase.execute({
      organizationId,
      feature,
    });
  }
}
