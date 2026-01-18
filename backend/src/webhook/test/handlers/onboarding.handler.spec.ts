import { Test, TestingModule } from '@nestjs/testing';
import { OnboardingHandler } from '../../application/handlers/onboarding.handler';
import { FeatureGuard } from '../../../common/guards/feature.guard';
import { I_USER_REPOSITORY } from '../../../user/domain/ports/user.repository.interface';
import { I_ORGANIZATION_REPOSITORY } from '../../../organization/domain/ports/organization.repository.interface';
import { StartOnboardingUseCase } from '../../../onboarding/application/use-cases/start-onboarding.use-case';
import { GetNextStepUseCase } from '../../../onboarding/application/use-cases/get-next-step.use-case';
import { GetAdoptionReportUseCase } from '../../../onboarding/application/use-cases/get-adoption-report.use-case';
import { LLMIntent } from '../../../common/llm/llm-types';
import { UserRole } from '../../../organization/domain/organization-member.entity';

describe('OnboardingHandler', () => {
    let handler: OnboardingHandler;
    let messagingService: any;
    let userRepository: any;
    let organizationRepository: any;
    let startOnboardingUseCase: any;
    let getNextStepUseCase: any;
    let getAdoptionReportUseCase: any;
    let featureGuard: any;

    const mockUser = { id: 'user-1', phoneNumber: '+2250707070707' };
    const mockOrgId = 'org-1';

    beforeEach(async () => {
        messagingService = {
            sendMessage: jest.fn(),
        };
        userRepository = {
            findByPhoneNumber: jest.fn().mockResolvedValue(mockUser),
        };
        organizationRepository = {
            findMember: jest.fn().mockResolvedValue({ role: UserRole.OWNER }),
        };
        startOnboardingUseCase = {
            execute: jest.fn().mockResolvedValue({}),
        };
        getNextStepUseCase = {
            execute: jest.fn(), // Should NOT be called
        };
        getAdoptionReportUseCase = {
            execute: jest.fn(),
        };
        featureGuard = {
            canAccess: jest.fn().mockResolvedValue(true),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OnboardingHandler,
                { provide: FeatureGuard, useValue: featureGuard },
                { provide: I_USER_REPOSITORY, useValue: userRepository },
                { provide: I_ORGANIZATION_REPOSITORY, useValue: organizationRepository },
                { provide: StartOnboardingUseCase, useValue: startOnboardingUseCase },
                { provide: GetNextStepUseCase, useValue: getNextStepUseCase },
                { provide: GetAdoptionReportUseCase, useValue: getAdoptionReportUseCase },
            ],
        }).compile();

        handler = module.get<OnboardingHandler>(OnboardingHandler);
    });

    it('should be defined', () => {
        expect(handler).toBeDefined();
    });

    it('should send welcome cheat sheet when START_ONBOARDING intent is received', async () => {
        const context: any = {
            senderPhoneNumber: mockUser.phoneNumber,
            organizationId: mockOrgId,
            messagingService,
        };

        await handler.handle({ intent: LLMIntent.START_ONBOARDING }, context);

        // Verify Start Use Case is called (for logging/init purposes)
        expect(startOnboardingUseCase.execute).toHaveBeenCalledWith({
            userId: mockUser.id,
            organizationId: mockOrgId,
            role: UserRole.OWNER,
        });

        // Verify GetNextStep is NOT called
        expect(getNextStepUseCase.execute).not.toHaveBeenCalled();

        // Verify Message Content (Standard Welcome / Cheat Sheet)
        expect(messagingService.sendMessage).toHaveBeenCalledWith(
            mockUser.phoneNumber,
            expect.stringContaining('Vente 50 euros pour 2 Plats')
        );
        expect(messagingService.sendMessage).toHaveBeenCalledWith(
            mockUser.phoneNumber,
            expect.stringContaining('🎤 *Envoyer une note vocale*')
        );
        expect(messagingService.sendMessage).toHaveBeenCalledWith(
            mockUser.phoneNumber,
            expect.stringContaining('Ajouter membre 0707070707 comme Staff')
        );
    });
});
