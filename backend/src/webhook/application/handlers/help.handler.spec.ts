import { Test, TestingModule } from '@nestjs/testing';
import { HelpHandler } from './help.handler';
import { I_USER_REPOSITORY } from '../../../user/domain/ports/user.repository.interface';
import { I_ORGANIZATION_REPOSITORY } from '../../../organization/domain/ports/organization.repository.interface';
import { ConfigService } from '@nestjs/config';
import { CheckFeatureUseCase } from '../../../subscription/application/use-cases/check-feature.use-case';
import { ActionContext } from './action-handler.interface';
import { MessagingPlatforms } from '../../../common/messaging/domain/constants/messaging-platforms.enum';
import { User } from '../../../user/domain/user.entity';
import { AgentOrchestratorService } from '../../../agent/agent-orchestrator.service';

describe('HelpHandler', () => {
    let handler: HelpHandler;
    let mockUserRepository: any;
    let mockOrganizationRepository: any;
    let mockMessagingService: any;
    let mockConfigService: any;
    let mockCheckFeatureUseCase: any;
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
            sendInteractiveButtons: jest.fn(),
            sendInteractiveList: jest.fn(),
        };

        mockConfigService = {
            get: jest.fn(),
        };

        mockCheckFeatureUseCase = {
            execute: jest.fn().mockResolvedValue({ hasAccess: true }),
        };

        mockAgentOrchestrator = {
            run: jest.fn().mockResolvedValue("Agent Response Here"),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                HelpHandler,
                { provide: I_USER_REPOSITORY, useValue: mockUserRepository },
                { provide: I_ORGANIZATION_REPOSITORY, useValue: mockOrganizationRepository },
                { provide: ConfigService, useValue: mockConfigService },
                { provide: CheckFeatureUseCase, useValue: mockCheckFeatureUseCase },
                { provide: AgentOrchestratorService, useValue: mockAgentOrchestrator },
            ],
        }).compile();

        handler = module.get<HelpHandler>(HelpHandler);
    });

    it('should be defined', () => {
        expect(handler).toBeDefined();
    });

    it('should call agent for new user', async () => {
        mockUserRepository.findByPhoneNumber.mockResolvedValue(null);

        const context: Partial<ActionContext> = {
            senderPhoneNumber: '123456789',
            messagingService: mockMessagingService,
            platform: MessagingPlatforms.WHATSAPP,
        };

        await handler.handle({}, context as ActionContext);

        expect(mockAgentOrchestrator.run).toHaveBeenCalledWith(
            expect.stringContaining('NO active organization'),
            '123456789',
            expect.objectContaining({ phoneNumber: '123456789' })
        );
        expect(mockMessagingService.sendMessage).toHaveBeenCalledWith(
            '123456789',
            "Agent Response Here"
        );
    });

    it('should call agent with features list for active member', async () => {
        const user = { id: 'user1', lastActiveOrganizationId: 'org1' } as User;
        mockUserRepository.findByPhoneNumber.mockResolvedValue(user);
        mockOrganizationRepository.findMember.mockResolvedValue({ role: 'OWNER' });

        const context: Partial<ActionContext> = {
            senderPhoneNumber: '123456789',
            organizationId: 'org1',
            messagingService: mockMessagingService,
            platform: MessagingPlatforms.WHATSAPP,
        };

        await handler.handle({}, context as ActionContext);

        expect(mockAgentOrchestrator.run).toHaveBeenCalledWith(
            expect.stringContaining('Nouvelle Dépense'),
            '123456789',
            expect.objectContaining({ organizationId: 'org1' })
        );
        expect(mockMessagingService.sendMessage).toHaveBeenCalledWith(
            '123456789',
            "Agent Response Here"
        );
    });
});
