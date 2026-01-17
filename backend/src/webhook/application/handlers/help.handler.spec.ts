import { Test, TestingModule } from '@nestjs/testing';
import { HelpHandler } from './help.handler';
import { I_USER_REPOSITORY } from '../../../user/domain/ports/user.repository.interface';
import { I_ORGANIZATION_REPOSITORY } from '../../../organization/domain/ports/organization.repository.interface';
import { ConfigService } from '@nestjs/config';
import { CheckFeatureUseCase } from '../../../subscription/application/use-cases/check-feature.use-case';
import { ActionContext } from './action-handler.interface';
import { MessagingPlatforms } from '../../../common/messaging/domain/constants/messaging-platforms.enum';
import { User } from '../../../user/domain/user.entity';

describe('HelpHandler', () => {
    let handler: HelpHandler;
    let mockUserRepository: any;
    let mockOrganizationRepository: any;
    let mockMessagingService: any;
    let mockConfigService: any;
    let mockCheckFeatureUseCase: any;

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

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                HelpHandler,
                { provide: I_USER_REPOSITORY, useValue: mockUserRepository },
                { provide: I_ORGANIZATION_REPOSITORY, useValue: mockOrganizationRepository },
                { provide: ConfigService, useValue: mockConfigService },
                { provide: CheckFeatureUseCase, useValue: mockCheckFeatureUseCase },
            ],
        }).compile();

        handler = module.get<HelpHandler>(HelpHandler);
    });

    it('should be defined', () => {
        expect(handler).toBeDefined();
    });

    it('should send interactive buttons for new user on WhatsApp', async () => {
        mockUserRepository.findByPhoneNumber.mockResolvedValue(null);

        const context: Partial<ActionContext> = {
            senderPhoneNumber: '123456789',
            messagingService: mockMessagingService,
            platform: MessagingPlatforms.WHATSAPP,
        };

        await handler.handle({}, context as ActionContext);

        expect(mockMessagingService.sendInteractiveButtons).toHaveBeenCalledWith(
            '123456789',
            expect.stringContaining('Bienvenue'),
            expect.arrayContaining([
                expect.objectContaining({ id: 'CREATE_ORG_CMD' }),
                expect.objectContaining({ id: 'HELP_CMD' })
            ])
        );
    });

    it('should send interactive list for active member on WhatsApp', async () => {
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

        expect(mockMessagingService.sendInteractiveList).toHaveBeenCalledWith(
            '123456789',
            expect.stringContaining('Event-Pilot Aide'),
            expect.any(String),
            expect.any(String),
            expect.arrayContaining([
                expect.objectContaining({ title: 'Opérations' }),
                expect.objectContaining({ title: 'Gestion & Rapports' }),
                expect.objectContaining({ title: 'Billetterie' })
            ])
        );
    });
});
