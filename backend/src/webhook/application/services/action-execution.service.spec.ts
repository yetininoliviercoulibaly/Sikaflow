import { Test, TestingModule } from '@nestjs/testing';
import { ActionExecutionService, ActionExecutionParams } from './action-execution.service';
import { ACTION_HANDLER_TOKEN } from '../handlers/action-handler.interface';
import { CheckSubscriptionUseCase } from '../../../subscription/application/use-cases/check-subscription.use-case';
import { CheckFeatureUseCase } from '../../../subscription/application/use-cases/check-feature.use-case';
import { ConfigService } from '@nestjs/config';
import { ConversationalGuidanceService } from './conversational-guidance.service';
import { ConversationStateService } from './conversation-state.service';
import { LLMIntent } from '../../../common/llm/llm-types';
import { MessagingPlatforms } from '../../../common/messaging/domain/constants/messaging-platforms.enum';
import { FeatureFlag } from '../../../subscription/domain/feature-flag.enum';

describe('ActionExecutionService Feature Enforcement', () => {
    let service: ActionExecutionService;
    let mockMessagingService: any;
    let mockCheckFeatureUseCase: any;
    let mockCheckSubscriptionUseCase: any;
    let mockConfigService: any;

    beforeEach(async () => {
        mockMessagingService = {
            sendMessage: jest.fn(),
            sendInteractiveButtons: jest.fn(),
        };

        mockCheckFeatureUseCase = {
            execute: jest.fn(),
        };

        mockCheckSubscriptionUseCase = {
            execute: jest.fn().mockResolvedValue({ hasAccess: true }),
        };

        mockConfigService = {
            get: jest.fn().mockReturnValue('false'), // BYPASS = false
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ActionExecutionService,
                { provide: ACTION_HANDLER_TOKEN, useValue: [] }, // No handlers needed for this test
                { provide: CheckSubscriptionUseCase, useValue: mockCheckSubscriptionUseCase },
                { provide: CheckFeatureUseCase, useValue: mockCheckFeatureUseCase },
                { provide: ConfigService, useValue: mockConfigService },
                { provide: ConversationalGuidanceService, useValue: { getGuidance: jest.fn() } },
                { provide: ConversationStateService, useValue: { clearPendingAction: jest.fn(), setPendingAction: jest.fn() } },
            ],
        }).compile();

        service = module.get<ActionExecutionService>(ActionExecutionService);
    });

    // III. ActionExecutionService Feature Gating - Access Denied for Premium Feature
    it('should block access if feature is missing and send correct message', async () => {
        // Setup: User requests CREATE_EVENT (Requires STOCK_MANAGEMENT)
        mockCheckFeatureUseCase.execute.mockResolvedValue({ hasAccess: false });

        const params: ActionExecutionParams = {
            actions: [{ intent: LLMIntent.CREATE_EVENT, data: {} }],
            messagingService: mockMessagingService,
            user: { lastActiveOrganizationId: 'org1', preferredLanguage: 'fr' } as any,
            senderPhoneNumber: '123456789',
            messageId: 'msg1',
            platform: MessagingPlatforms.WHATSAPP,
        };

        await service.execute(params);

        expect(mockCheckFeatureUseCase.execute).toHaveBeenCalledWith({
            organizationId: 'org1',
            feature: FeatureFlag.STOCK_MANAGEMENT
        });

        // "🔒 Fonctionnalité réservée.\nL'action demandée nécessite le module "STOCK_MANAGEMENT".\nVotre plan actuel ne l'inclut pas."
        const expectedMessage = `🔒 Fonctionnalité réservée.\nL'action demandée nécessite le module "STOCK_MANAGEMENT".\nVotre plan actuel ne l'inclut pas.`;

        expect(mockMessagingService.sendMessage).toHaveBeenCalledWith(
            '123456789',
            expectedMessage
        );
    });

    // III. ActionExecutionService Feature Gating - Access Granted for Premium Feature
    it('should allow access if feature is enabled', async () => {
        mockCheckFeatureUseCase.execute.mockResolvedValue({ hasAccess: true });

        const params: ActionExecutionParams = {
            actions: [{ intent: LLMIntent.CREATE_EVENT, data: {} }],
            messagingService: mockMessagingService,
            user: { lastActiveOrganizationId: 'org1', preferredLanguage: 'fr' } as any,
            senderPhoneNumber: '123456789',
            messageId: 'msg1',
            platform: MessagingPlatforms.WHATSAPP,
        };

        await service.execute(params);

        expect(mockMessagingService.sendMessage).not.toHaveBeenCalledWith(
            '123456789',
            expect.stringContaining('Fonctionnalité réservée')
        );
    });

    // III. ActionExecutionService Feature Gating - Access to Non-Premium Feature (No Gating)
    it('should not check feature for non-premium actions', async () => {
        const params: ActionExecutionParams = {
            actions: [{ intent: LLMIntent.CREATE_TRANSACTION, data: {} }],
            messagingService: mockMessagingService,
            user: { lastActiveOrganizationId: 'org1', preferredLanguage: 'fr' } as any,
            senderPhoneNumber: '123456789',
            messageId: 'msg1',
            platform: MessagingPlatforms.WHATSAPP,
        };

        await service.execute(params);

        expect(mockCheckFeatureUseCase.execute).not.toHaveBeenCalled();
    });
});
