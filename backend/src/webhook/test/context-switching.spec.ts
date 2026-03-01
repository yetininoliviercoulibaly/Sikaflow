import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ProcessUnifiedMessageUseCase } from '../application/use-cases/process-unified-message.use-case';
import { ConversationStateService } from '../application/services/conversation-state.service';
import { I_USER_REPOSITORY } from '../../user/domain/ports/user.repository.interface';
import { LLM_PROVIDER_TOKEN } from '../../common/llm/llm-provider.interface';
import { I_PROMPT_REPOSITORY } from '../../common/prompt/domain/ports/prompt.repository.interface';
import { ActionExecutionService } from '../application/services/action-execution.service';
import { CommandIntentMapper } from '../application/services/command-intent.mapper';
import { LLMIntent } from '../../common/llm/llm-types';
import { AgentOrchestratorService } from '../../agent/agent-orchestrator.service';
import { MessageExtractionService } from '../application/services/message-extraction.service';
import { MediaStandardizationService } from '../application/services/media-standardization.service';
import { MessageEntity, MessageType } from '../domain/message.entity';
import { MessagingPlatforms } from '../../common/messaging/domain/constants/messaging-platforms.enum';
import { IntentResolverService } from '../application/services/intent-resolver.service';
import { AnalysisOrchestratorService } from '../application/services/analysis-orchestrator.service';

class MockConversationStateService {
    private state = new Map<string, any>();
    async getPendingAction(id: string) { return this.state.get(id) || null; }
    async setPendingAction(id: string, action: any) { this.state.set(id, action); }
    async clearPendingAction(id: string) { this.state.delete(id); }
}

describe('Context Switching Logic', () => {
    let useCase: ProcessUnifiedMessageUseCase;
    let conversationState: ConversationStateService;
    let llmProvider: any;
    let mockMessaging: any;
    let intentResolver: IntentResolverService;

    const mockUser = {
        id: 'user-123',
        phoneNumber: '123456789',
        lastActiveOrganizationId: 'org-123'
    };

    beforeEach(async () => {
        mockMessaging = { sendMessage: jest.fn() };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProcessUnifiedMessageUseCase,
                { provide: ConversationStateService, useClass: MockConversationStateService },
                MessageExtractionService,
                AnalysisOrchestratorService,
                CommandIntentMapper,
                IntentResolverService,
                {
                    provide: I_USER_REPOSITORY,
                    useValue: { findByPhoneNumber: jest.fn().mockResolvedValue(mockUser), findByIdentifier: jest.fn().mockResolvedValue(mockUser) }
                },
                {
                    provide: LLM_PROVIDER_TOKEN,
                    useValue: {
                        analyzeText: jest.fn()
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
                {
                    provide: AgentOrchestratorService,
                    useValue: { run: jest.fn() }
                },
                {
                    provide: MediaStandardizationService,
                    useValue: { transcribeAudio: jest.fn() }
                },
                {
                    provide: ConfigService,
                    useValue: { get: jest.fn().mockReturnValue('false') }
                },
            ],
        }).compile();

        useCase = module.get<ProcessUnifiedMessageUseCase>(ProcessUnifiedMessageUseCase);
        conversationState = module.get<ConversationStateService>(ConversationStateService);
        llmProvider = module.get(LLM_PROVIDER_TOKEN);
    });

    const createMessage = (text: string): MessageEntity => ({
        platform: MessagingPlatforms.TELEGRAM,
        senderId: '123456789',
        messageId: 'msg-1',
        type: MessageType.TEXT,
        content: text
    });

    it('should break context loop when user sends a completely new unrelated command', async () => {
        const chatId = '123456789';
        // 1. Setup Penalty: Pending ADD_MEMBER
        await conversationState.setPendingAction(chatId, {
            intent: LLMIntent.ADD_MEMBER,
            data: { phone: '0600000000' },
            missing_fields: ['role'],
            createdAt: new Date()
        });

        // 2. Mock LLM to detect CREATE_TRANSACTION (Unrelated intent)
        llmProvider.analyzeText.mockResolvedValue({
            intent: LLMIntent.CREATE_TRANSACTION,
            data: { amount: 500, type: 'INCOME', currency: 'EUR' },
            confidence: 0.95,
            actions: [] 
        } as any);

        // 3. Execute
        await useCase.execute(createMessage("Recette de 500 euros"), mockMessaging);

        // 4. Verify Context Cleared or Switched
        const pending = await conversationState.getPendingAction(chatId);
        // It might be cleared (if processed) or switched. But DEFINITELY NOT ADD_MEMBER.
        if (pending) {
            expect(pending.intent).not.toBe(LLMIntent.ADD_MEMBER);
        }
    });

    it('should break context when user explicitly says STOP', async () => {
         const chatId = '123456789';
         await conversationState.setPendingAction(chatId, {
             intent: LLMIntent.ADD_MEMBER,
             data: { phone: '0600000000' },
             missing_fields: ['role'],
             createdAt: new Date()
         });
 
         // For STOP, the LLM might return STOP or the use case handles heuristic regex
         llmProvider.analyzeText.mockResolvedValue({ intent: 'STOP', data: {}, actions: [] } as any);
 
         await useCase.execute(createMessage("STOP"), mockMessaging);
 
         const pending = await conversationState.getPendingAction(chatId);
         expect(pending).toBeNull();
    });

    it('should break context when user asks for HELP', async () => {
        const chatId = '123456789';
        await conversationState.setPendingAction(chatId, {
            intent: LLMIntent.ADD_MEMBER,
            data: { phone: '0600000000' },
            missing_fields: ['role'],
            createdAt: new Date()
        });

        llmProvider.analyzeText.mockResolvedValue({ 
            intent: LLMIntent.HELP, 
            data: {}, 
            confidence: 0.9,
            actions: [] 
        } as any);

        await useCase.execute(createMessage("Aide"), mockMessaging);

        const pending = await conversationState.getPendingAction(chatId);
        expect(pending).toBeNull();
    });
});
