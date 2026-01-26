import { Test, TestingModule } from '@nestjs/testing';
import { UnknownIntentHandler } from './unknown-intent.handler';
import { AgentOrchestratorService } from '../../../agent/agent-orchestrator.service';
import { ActionContext } from './action-handler.interface';
import { MessagingPlatforms } from '../../../common/messaging/domain/constants/messaging-platforms.enum';
import { LLMIntent } from '../../../common/llm/llm-types';

describe('UnknownIntentHandler', () => {
    let handler: UnknownIntentHandler;
    let mockAgentOrchestrator: any;
    let mockMessagingService: any;

    beforeEach(async () => {
        mockAgentOrchestrator = {
            run: jest.fn().mockResolvedValue("Agent response for unknown intent"),
        };

        mockMessagingService = {
            sendMessage: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UnknownIntentHandler,
                { provide: AgentOrchestratorService, useValue: mockAgentOrchestrator },
            ],
        }).compile();

        handler = module.get<UnknownIntentHandler>(UnknownIntentHandler);
    });

    it('should be defined', () => {
        expect(handler).toBeDefined();
    });

    it('should delegate to agent and send response', async () => {
        const context: Partial<ActionContext> = {
            senderPhoneNumber: '123456789',
            organizationId: 'org1',
            messagingService: mockMessagingService,
            messageBody: 'some weird query',
            platform: MessagingPlatforms.WHATSAPP,
        };

        await handler.handle({}, context as ActionContext);

        expect(mockAgentOrchestrator.run).toHaveBeenCalledWith(
            'some weird query',
            '123456789',
            expect.objectContaining({ phoneNumber: '123456789', organizationId: 'org1' })
        );

        expect(mockMessagingService.sendMessage).toHaveBeenCalledWith(
            '123456789',
            "Agent response for unknown intent"
        );
    });

    it('should handle empty message body fallback', async () => {
        const context: Partial<ActionContext> = {
            senderPhoneNumber: '123456789',
            messagingService: mockMessagingService,
            messageBody: undefined,
            platform: MessagingPlatforms.WHATSAPP,
        };

        await handler.handle({}, context as ActionContext);

        expect(mockAgentOrchestrator.run).toHaveBeenCalledWith(
            'Bonjour',
            '123456789',
            expect.anything()
        );
    });
});
