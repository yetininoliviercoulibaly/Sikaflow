import { Test, TestingModule } from '@nestjs/testing';
import { HelpHandler } from './help.handler';
import { I_USER_REPOSITORY } from '../../../user/domain/ports/user.repository.interface';
import { I_ORGANIZATION_REPOSITORY } from '../../../organization/domain/ports/organization.repository.interface';
import { GetOrganizationFeaturesUseCase } from '../../../subscription/application/use-cases/get-organization-features.use-case';
import { ActionContext } from './action-handler.interface';
import { MessagingPlatforms } from '../../../common/messaging/domain/constants/messaging-platforms.enum';
import { User } from '../../../user/domain/user.entity';
import { AgentOrchestratorService } from '../../../agent/agent-orchestrator.service';
import { FeatureFlag } from '../../../subscription/domain/feature-flag.enum';

describe('HelpHandler', () => {
    let handler: HelpHandler;
    let mockUserRepository: any;
    let mockOrganizationRepository: any;
    let mockMessagingService: any;
    let mockGetOrganizationFeaturesUseCase: any;
    let mockAgentOrchestrator: any;

    beforeEach(async () => {
        mockUserRepository = {
            findByPhoneNumber: jest.fn(),
        };

        mockOrganizationRepository = {
            findMember: jest.fn(),
        };

        mockMessagingService = {
            sendMessage: jest.fn(),
        };

        mockGetOrganizationFeaturesUseCase = {
            execute: jest.fn(),
        };

        mockAgentOrchestrator = {
            run: jest.fn().mockResolvedValue("Agent Response Here"),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                HelpHandler,
                { provide: I_USER_REPOSITORY, useValue: mockUserRepository },
                { provide: I_ORGANIZATION_REPOSITORY, useValue: mockOrganizationRepository },
                { provide: GetOrganizationFeaturesUseCase, useValue: mockGetOrganizationFeaturesUseCase },
                { provide: AgentOrchestratorService, useValue: mockAgentOrchestrator },
            ],
        }).compile();

        handler = module.get<HelpHandler>(HelpHandler);
    });

    it('should be defined', () => {
        expect(handler).toBeDefined();
    });

    // I. HelpHandler Functionality - New User Help Request (No Organization)
    it('should call agent for new user (no organization)', async () => {
        mockUserRepository.findByPhoneNumber.mockResolvedValue(null);

        const context: Partial<ActionContext> = {
            senderPhoneNumber: '123456789',
            messagingService: mockMessagingService,
            platform: MessagingPlatforms.WHATSAPP,
        };

        await handler.handle({}, context as ActionContext);

        expect(mockAgentOrchestrator.run).toHaveBeenCalledWith(
            expect.stringContaining('"user_role": "NEW_USER"'),
            '123456789',
            expect.objectContaining({ phoneNumber: '123456789' })
        );
        expect(mockAgentOrchestrator.run).toHaveBeenCalledWith(
            expect.stringContaining('Créer une Organisation (Club)'),
            expect.any(String),
            expect.any(Object)
        );
    });

    // I. HelpHandler Functionality - Existing User Help Request - Free Plan (Staff Role)
    it('should call agent for staff user with free plan', async () => {
        const user = { id: 'user1', lastActiveOrganizationId: 'org1' } as User;
        mockUserRepository.findByPhoneNumber.mockResolvedValue(user);
        mockOrganizationRepository.findMember.mockResolvedValue({ role: 'STAFF' });

        mockGetOrganizationFeaturesUseCase.execute.mockResolvedValue({
            planName: 'Aucun (Gratuit)',
            features: [FeatureFlag.TRANSACTIONS, FeatureFlag.BASIC_REPORTS]
        });

        const context: Partial<ActionContext> = {
            senderPhoneNumber: '123456789',
            organizationId: 'org1',
            messagingService: mockMessagingService,
            platform: MessagingPlatforms.WHATSAPP,
        };

        await handler.handle({}, context as ActionContext);

        expect(mockAgentOrchestrator.run).toHaveBeenCalledWith(
            expect.stringContaining('"user_role": "STAFF"'),
            '123456789',
            expect.objectContaining({ organizationId: 'org1' })
        );
        expect(mockAgentOrchestrator.run).toHaveBeenCalledWith(
            expect.stringContaining('"subscription_plan": "Aucun (Gratuit)"'),
            expect.any(String),
            expect.any(Object)
        );
        expect(mockAgentOrchestrator.run).toHaveBeenCalledWith(
            expect.stringContaining('Gestion des Dépenses & Recettes'),
            expect.any(String),
            expect.any(Object)
        );
         expect(mockAgentOrchestrator.run).toHaveBeenCalledWith(
            expect.stringContaining('Rapports de base'),
            expect.any(String),
            expect.any(Object)
        );
    });

    // I. HelpHandler Functionality - Existing User Help Request - Premium Plan (Owner/Manager Role)
    it('should call agent for owner/manager with premium plan', async () => {
        const user = { id: 'user1', lastActiveOrganizationId: 'org1' } as User;
        mockUserRepository.findByPhoneNumber.mockResolvedValue(user);
        mockOrganizationRepository.findMember.mockResolvedValue({ role: 'OWNER' }); // or MANAGER

        mockGetOrganizationFeaturesUseCase.execute.mockResolvedValue({
            planName: 'Premium Plan',
            features: [
                FeatureFlag.TRANSACTIONS,
                FeatureFlag.STOCK_MANAGEMENT,
                FeatureFlag.ADVANCED_ANALYTICS,
                FeatureFlag.INCIDENT_COMPLIANCE
            ]
        });

        const context: Partial<ActionContext> = {
            senderPhoneNumber: '123456789',
            organizationId: 'org1',
            messagingService: mockMessagingService,
            platform: MessagingPlatforms.WHATSAPP,
        };

        await handler.handle({}, context as ActionContext);

        expect(mockAgentOrchestrator.run).toHaveBeenCalledWith(
            expect.stringContaining('"user_role": "OWNER"'),
            '123456789',
            expect.objectContaining({ organizationId: 'org1' })
        );
        expect(mockAgentOrchestrator.run).toHaveBeenCalledWith(
            expect.stringContaining('"subscription_plan": "Premium Plan"'),
            expect.any(String),
            expect.any(Object)
        );

        // Verifying some of the features
        expect(mockAgentOrchestrator.run).toHaveBeenCalledWith(
            expect.stringContaining('Gestion Événements & Billetterie'),
            expect.any(String),
            expect.any(Object)
        );
        expect(mockAgentOrchestrator.run).toHaveBeenCalledWith(
            expect.stringContaining('Analyses Financières Avancées (Bilan Hebdo)'),
            expect.any(String),
            expect.any(Object)
        );
        expect(mockAgentOrchestrator.run).toHaveBeenCalledWith(
            expect.stringContaining("Signalement d'Incidents & Sécurité"),
            expect.any(String),
            expect.any(Object)
        );
    });
});
