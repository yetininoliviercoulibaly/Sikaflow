import { Inject, Injectable } from '@nestjs/common';
import { FeatureFlag } from '../../domain/feature-flag.enum';
import { I_ORGANIZATION_REPOSITORY, IOrganizationRepository } from '../../../organization/domain/ports/organization.repository.interface';
import { I_SUBSCRIPTION_PLAN_REPOSITORY, ISubscriptionPlanRepository } from '../../domain/ports/subscription-plan.repository.interface';

export interface CheckFeatureInput {
  organizationId: string;
  feature: FeatureFlag;
}

export interface CheckFeatureOutput {
  hasAccess: boolean;
  planName?: string;
}

@Injectable()
export class CheckFeatureUseCase {
  constructor(
    @Inject(I_ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: IOrganizationRepository,
    @Inject(I_SUBSCRIPTION_PLAN_REPOSITORY)
    private readonly subscriptionPlanRepository: ISubscriptionPlanRepository,
  ) {}

  async execute(input: CheckFeatureInput): Promise<CheckFeatureOutput> {
    const { organizationId, feature } = input;

    // Get organization
    const organization = await this.organizationRepository.findById(organizationId);
    if (!organization || !organization.currentPlanId) {
      return { hasAccess: false };
    }

    // Get subscription plan
    const plan = await this.subscriptionPlanRepository.findById(organization.currentPlanId);
    if (!plan) {
      return { hasAccess: false };
    }

    // Check if feature is enabled in the plan
    const hasAccess = plan.enabledFeatures.includes(feature);
    return {
      hasAccess,
      planName: plan.name,
    };
  }
}
