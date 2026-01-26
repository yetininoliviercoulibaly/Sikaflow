import { Inject, Injectable } from '@nestjs/common';
import { I_ORGANIZATION_REPOSITORY, IOrganizationRepository } from '../../../organization/domain/ports/organization.repository.interface';
import { I_SUBSCRIPTION_PLAN_REPOSITORY, ISubscriptionPlanRepository } from '../../domain/ports/subscription-plan.repository.interface';
import { FeatureFlag } from '../../domain/feature-flag.enum';

export interface GetOrganizationFeaturesOutput {
  planName: string;
  features: FeatureFlag[];
}

@Injectable()
export class GetOrganizationFeaturesUseCase {
  constructor(
    @Inject(I_ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: IOrganizationRepository,
    @Inject(I_SUBSCRIPTION_PLAN_REPOSITORY)
    private readonly subscriptionPlanRepository: ISubscriptionPlanRepository,
  ) {}

  async execute(organizationId: string): Promise<GetOrganizationFeaturesOutput> {
    const organization = await this.organizationRepository.findById(organizationId);

    // Default / Fallback if no plan
    const defaultOutput: GetOrganizationFeaturesOutput = {
        planName: 'Aucun (Gratuit)',
        features: [FeatureFlag.TRANSACTIONS, FeatureFlag.BASIC_REPORTS] // Core features always active
    };

    if (!organization || !organization.currentPlanId) {
      return defaultOutput;
    }

    const plan = await this.subscriptionPlanRepository.findById(organization.currentPlanId);
    if (!plan) {
      return defaultOutput;
    }

    return {
      planName: plan.name,
      features: plan.enabledFeatures,
    };
  }
}
