import { Test, TestingModule } from '@nestjs/testing';
import { NotImplementedHandler } from '../../application/handlers/not-implemented.handler';
import { LLMIntent } from '../../../common/llm/llm-types';
import { ActionContext } from '../../application/handlers/action-handler.interface';

describe('NotImplementedHandler', () => {
    let handler: NotImplementedHandler;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                NotImplementedHandler,
            ],
        }).compile();

        handler = module.get<NotImplementedHandler>(NotImplementedHandler);
    });

    it('should be defined', () => {
        expect(handler).toBeDefined();
    });

    it('should NOT handle CANCEL_LAST_ACTION intent', () => {
        // This is the regression test for the bug
        expect(handler.canHandle(LLMIntent.CANCEL_LAST_ACTION)).toBe(false);
    });

    it('should handle UPDATE_LAST_ACTION intent', () => {
        expect(handler.canHandle(LLMIntent.UPDATE_LAST_ACTION)).toBe(true);
    });

    it('should send "not implemented" message', async () => {
        const mockMessagingService = {
            sendMessage: jest.fn(),
        };

        const context: ActionContext = {
            senderPhoneNumber: '123456789',
            messagingService: mockMessagingService as any,
            messageId: '1',
            organizationId: 'org1',
            language: 'fr',
            platform: 'TELEGRAM' as any,
        };

        await handler.handle({}, context);

        expect(mockMessagingService.sendMessage).toHaveBeenCalledWith(
            '123456789',
            expect.stringContaining("pas encore disponible")
        );
    });
});
