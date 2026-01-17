import { Test, TestingModule } from '@nestjs/testing';
import { CreateTransactionHandler } from './create-transaction.handler';
import { CreateTransactionUseCase } from '../../../transaction/application/use-cases/create-transaction.use-case';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ActionContext } from './action-handler.interface';
import { LLMIntent } from '../../../common/llm/llm-types';

describe('CreateTransactionHandler', () => {
    let handler: CreateTransactionHandler;
    let mockUseCase: any;
    let mockEventEmitter: any;
    let mockMessagingService: any;

    beforeEach(async () => {
        mockUseCase = { execute: jest.fn() };
        mockEventEmitter = { emit: jest.fn() };
        mockMessagingService = { 
            sendMessage: jest.fn(),
            sendInteractiveButtons: jest.fn()
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CreateTransactionHandler,
                { provide: CreateTransactionUseCase, useValue: mockUseCase },
                { provide: EventEmitter2, useValue: mockEventEmitter },
            ],
        }).compile();

        handler = module.get<CreateTransactionHandler>(CreateTransactionHandler);
    });

    it('should handle low confidence with localized buttons', async () => {
        const data = {
            confidence: 0.5,
            amount: 100,
            currency: 'EUR',
            type: 'EXPENSE',
            category: 'FOOD'
        };

        const context = {
            senderPhoneNumber: '123',
            messagingService: mockMessagingService
        } as unknown as ActionContext;

        await handler.handle(data, context);

        expect(mockMessagingService.sendInteractiveButtons).toHaveBeenCalledWith(
            '123',
            expect.stringContaining('Alimentation 🍔'), // Localized Category
            expect.any(Array)
        );
        expect(mockUseCase.execute).not.toHaveBeenCalled();
    });

    it('should confirmation message with localized category', async () => {
        const data = {
            confidence: 0.99,
            amount: 500,
            currency: 'EUR',
            type: 'INCOME',
            category: 'TICKET'
        };

        const context = {
            senderPhoneNumber: '123',
            messagingService: mockMessagingService,
            platform: 'WHATSAPP'
        } as unknown as ActionContext;

        mockUseCase.execute.mockResolvedValue({ reportedByUserId: 'user1' });

        await handler.handle(data, context);

        expect(mockUseCase.execute).toHaveBeenCalled();
        expect(mockMessagingService.sendMessage).toHaveBeenCalledWith(
            '123',
            expect.stringContaining('Billetterie 🎫')
        );
        expect(mockMessagingService.sendMessage).toHaveBeenCalledWith(
            '123',
            expect.stringContaining('Recette 💰')
        );
    });
});
