import { Test, TestingModule } from '@nestjs/testing';
import { GetOrganizationFeaturesUseCase } from './get-organization-features.use-case';
import { I_ORGANIZATION_REPOSITORY } from '../../../organization/domain/ports/organization.repository.interface';
import { I_SUBSCRIPTION_PLAN_REPOSITORY } from '../../domain/ports/subscription-plan.repository.interface';
import { FeatureFlag } from '../../domain/feature-flag.enum';

describe('GetOrganizationFeaturesUseCase', () => {
    let useCase: GetOrganizationFeaturesUseCase;
    let mockOrganizationRepository: any;
    let mockSubscriptionPlanRepository: any;

    beforeEach(async () => {
        mockOrganizationRepository = {
            findById: jest.fn(),
        };

        mockSubscriptionPlanRepository = {
            findById: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GetOrganizationFeaturesUseCase,
                { provide: I_ORGANIZATION_REPOSITORY, useValue: mockOrganizationRepository },
                { provide: I_SUBSCRIPTION_PLAN_REPOSITORY, useValue: mockSubscriptionPlanRepository },
            ],
        }).compile();

        useCase = module.get<GetOrganizationFeaturesUseCase>(GetOrganizationFeaturesUseCase);
    });

    // IV. GetOrganizationFeaturesUseCase (Internal Logic) - Organization with No Subscription Plan
    it('should return default features for organization with no plan', async () => {
        mockOrganizationRepository.findById.mockResolvedValue({ id: 'org1', currentPlanId: null });

        const result = await useCase.execute('org1');

        expect(result).toEqual({
            planName: 'Aucun (Gratuit)',
            features: [FeatureFlag.TRANSACTIONS, FeatureFlag.BASIC_REPORTS],
        });
    });

    // IV. GetOrganizationFeaturesUseCase (Internal Logic) - Organization with Invalid Subscription Plan ID
    it('should return default features for organization with invalid plan ID', async () => {
        mockOrganizationRepository.findById.mockResolvedValue({ id: 'org1', currentPlanId: 'invalid-plan' });
        mockSubscriptionPlanRepository.findById.mockResolvedValue(null);

        const result = await useCase.execute('org1');

        expect(result).toEqual({
            planName: 'Aucun (Gratuit)',
            features: [FeatureFlag.TRANSACTIONS, FeatureFlag.BASIC_REPORTS],
        });
    });

    // IV. GetOrganizationFeaturesUseCase (Internal Logic) - Organization with Valid Subscription Plan
    it('should return correct features for organization with valid plan', async () => {
        mockOrganizationRepository.findById.mockResolvedValue({ id: 'org1', currentPlanId: 'plan1' });
        mockSubscriptionPlanRepository.findById.mockResolvedValue({
            id: 'plan1',
            name: 'Premium',
            enabledFeatures: [FeatureFlag.TRANSACTIONS, FeatureFlag.STOCK_MANAGEMENT],
        });

        const result = await useCase.execute('org1');

        expect(result).toEqual({
            planName: 'Premium',
            features: [FeatureFlag.TRANSACTIONS, FeatureFlag.STOCK_MANAGEMENT],
        });
    });
});
