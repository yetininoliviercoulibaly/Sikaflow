import { Test, TestingModule } from '@nestjs/testing';
import { ProcessTelegramMessageUseCase } from '../application/use-cases/process-telegram-message.use-case';
import { ConversationStateService } from '../application/services/conversation-state.service';
import { TelegramMessagingAdapter } from '../../common/messaging/telegram-messaging.adapter';
import { I_USER_REPOSITORY } from '../../user/domain/ports/user.repository.interface';
import { LLM_PROVIDER_TOKEN } from '../../common/llm/llm-provider.interface';
import { I_PROMPT_REPOSITORY } from '../../common/prompt/domain/ports/prompt.repository.interface';
import { ActionExecutionService } from '../application/services/action-execution.service';
import { CommandIntentMapper } from '../application/services/command-intent.mapper';
import { LLMIntent } from '../../common/llm/llm-types';

describe('Context Switching Logic', () => {
    let useCase: ProcessTelegramMessageUseCase;
    let conversationState: ConversationStateService;
    let llmProvider: any;

    const mockUser = {
        id: 'user-123',
        phoneNumber: '123456789',
        lastActiveOrganizationId: 'org-123'
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProcessTelegramMessageUseCase,
                ConversationStateService,
                {
                    provide: TelegramMessagingAdapter,
                    useValue: { sendMessage: jest.fn() }
                },
                {
                    provide: I_USER_REPOSITORY,
                    useValue: { findByPhoneNumber: jest.fn().mockResolvedValue(mockUser) }
                },
                {
                    provide: LLM_PROVIDER_TOKEN,
                    useValue: {
                        analyzeText: jest.fn() // Will be mocked per test
                    }
                },
                {
                    provide: I_PROMPT_REPOSITORY,
                    useValue: { getTemplate: jest.fn().mockResolvedValue({ content: 'prompt' }) }
                },
                {
                    provide: ActionExecutionService,
                    useValue: { execute: jest.fn() }
                },
                CommandIntentMapper
            ],
        }).compile();

        useCase = module.get<ProcessTelegramMessageUseCase>(ProcessTelegramMessageUseCase);
        conversationState = module.get<ConversationStateService>(ConversationStateService);
        llmProvider = module.get(LLM_PROVIDER_TOKEN);
    });

    it('should break context loop when user sends a completely new unrelated command', async () => {
        // 1. Setup Penalty: Pending ADD_MEMBER missing 'role'
        const chatId = '123456789';
        conversationState.setPendingAction(chatId, {
            intent: LLMIntent.ADD_MEMBER,
            data: { phone: '0600000000' },
            missing_fields: ['role'],
            createdAt: new Date()
        });

        // 2. User sends "Recette de 500 euros" 
        // Mock LLM to detect CREATE_TRANSACTION with high confidence
        llmProvider.analyzeText.mockResolvedValue({
            intent: LLMIntent.CREATE_TRANSACTION,
            data: { amount: 500, type: 'INCOME', currency: 'EUR' },
            confidence: 0.95
        });

        // 3. Execute
        await useCase.execute({
            update_id: 1,
            message: {
                message_id: 1,
                date: 123456,
                chat: { id: 123456789, type: 'private', first_name: 'Test' },
                from: { id: 123456789, is_bot: false, first_name: 'Test' },
                text: "Recette de 500 euros",
            }
        } as any);

        // 4. Verify Context Cleared or Switched
        const pending = conversationState.getPendingAction(chatId);
        // Expecting pending to be cleared OR switched to new intent if it had missing fields.
        // In this specific mock, 'Recette de 500 euros' might be complete or missing category.
        // But crucially, it should NOT be ADD_MEMBER anymore.
        
        // If the new action is complete (CREATE_TRANSACTION usually needs category), it might execute directly.
        // If it starts a new flow, pending might be CREATE_TRANSACTION.
        
        // For this test, we just want to ensure LLMIntent.ADD_MEMBER is GONE.
        if (pending) {
            expect(pending.intent).not.toBe(LLMIntent.ADD_MEMBER);
        }
    });

    it('should break context when user explicitly says STOP', async () => {
         const chatId = '123456789';
         conversationState.setPendingAction(chatId, {
             intent: LLMIntent.ADD_MEMBER,
             data: { phone: '0600000000' },
             missing_fields: ['role'],
             createdAt: new Date()
         });
 
         llmProvider.analyzeText.mockResolvedValue({ intent: 'STOP', data: {} });
 
         await useCase.execute({
             update_id: 2,
             message: {
                 message_id: 2,
                 date: 123456,
                 chat: { id: 123456789, type: 'private', first_name: 'Test' },
                 from: { id: 123456789, is_bot: false, first_name: 'Test' },
                 text: "STOP",
             }
         } as any);
 
         const pending = conversationState.getPendingAction(chatId);
         expect(pending).toBeNull();
    });

    it('should break context when user asks for HELP', async () => {
        const chatId = '123456789';
        conversationState.setPendingAction(chatId, {
            intent: LLMIntent.ADD_MEMBER,
            data: { phone: '0600000000' },
            missing_fields: ['role'],
            createdAt: new Date()
        });

        llmProvider.analyzeText.mockResolvedValue({ intent: LLMIntent.HELP, data: {} });

        await useCase.execute({
            update_id: 3,
            message: {
                message_id: 3,
                date: 123456,
                chat: { id: 123456789, type: 'private', first_name: 'Test' },
                from: { id: 123456789, is_bot: false, first_name: 'Test' },
                text: "Aide",
            }
        } as any);

        const pending = conversationState.getPendingAction(chatId);
        expect(pending).toBeNull(); // Should be cleared to allow Help to run
    });
});
