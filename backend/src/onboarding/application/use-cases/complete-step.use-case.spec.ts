
import { Test, TestingModule } from '@nestjs/testing';
import { CompleteStepUseCase } from './complete-step.use-case';
import { OnboardingStepId } from '../../domain/onboarding-progress.entity';
import { I_ONBOARDING_REPOSITORY } from '../../domain/ports/onboarding.repository.interface';

describe('CompleteStepUseCase', () => {
  let useCase: CompleteStepUseCase;
  let mockRepo: any;

  beforeEach(async () => {
    mockRepo = {
      findByUserAndOrganization: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompleteStepUseCase,
        { provide: I_ONBOARDING_REPOSITORY, useValue: mockRepo },
      ],
    }).compile();

    useCase = module.get<CompleteStepUseCase>(CompleteStepUseCase);
  });

  it('should complete a step and advance to the next ordered step', async () => {
    const progress = {
      userId: 'user1',
      organizationId: 'org1',
      role: 'OWNER',
      currentStep: OnboardingStepId.WELCOME,
      completedSteps: [],
      completedAt: null,
    };

    mockRepo.findByUserAndOrganization.mockResolvedValue(progress);

    const result = await useCase.execute({
      userId: 'user1',
      organizationId: 'org1',
      stepId: OnboardingStepId.WELCOME,
    });

    expect(result.success).toBe(true);
    expect(progress.completedSteps).toContain(OnboardingStepId.WELCOME);
    expect(progress.currentStep).toBe(OnboardingStepId.CREATE_FIRST_TRANSACTION);
    expect(mockRepo.update).toHaveBeenCalled();
  });

  it('should NOT backtrack currentStep if an earlier step is completed out of order', async () => {
    // Scenario: User already at step 3 (ADD_TEAM_MEMBER), then completes step 1 (WELCOME)
    const progress = {
      userId: 'user1',
      organizationId: 'org1',
      role: 'OWNER',
      currentStep: OnboardingStepId.ADD_TEAM_MEMBER,
      completedSteps: [OnboardingStepId.CREATE_FIRST_TRANSACTION],
      completedAt: null,
    };

    mockRepo.findByUserAndOrganization.mockResolvedValue(progress);

    const result = await useCase.execute({
      userId: 'user1',
      organizationId: 'org1',
      stepId: OnboardingStepId.WELCOME,
    });

    expect(result.success).toBe(true);
    expect(progress.completedSteps).toContain(OnboardingStepId.WELCOME);
    
    // CURRENT BUG: It might advance to the NEXT of WELCOME, which is CREATE_FIRST_TRANSACTION
    // Expected: It should STAY at ADD_TEAM_MEMBER (or advance if it's the current step)
    expect(progress.currentStep).toBe(OnboardingStepId.ADD_TEAM_MEMBER);
  });

  it('should skip already completed steps when advancing', async () => {
    // Scenario: User at step 1 (WELCOME). Step 2 (CREATE_FIRST_TRANSACTION) is already completed.
    // Completing step 1 should skip step 2 and go to step 3 (TRACK_FIRST_DEBT).
    const progress = {
      userId: 'user1',
      organizationId: 'org1',
      role: 'OWNER',
      currentStep: OnboardingStepId.WELCOME,
      completedSteps: [OnboardingStepId.CREATE_FIRST_TRANSACTION],
      completedAt: null,
    };

    mockRepo.findByUserAndOrganization.mockResolvedValue(progress);

    const result = await useCase.execute({
      userId: 'user1',
      organizationId: 'org1',
      stepId: OnboardingStepId.WELCOME,
    });

    expect(result.success).toBe(true);
    // Step 2 is already done, so the next uncompleted step is step 3 (TRACK_FIRST_DEBT)
    expect(progress.currentStep).toBe(OnboardingStepId.TRACK_FIRST_DEBT);
  });
});
