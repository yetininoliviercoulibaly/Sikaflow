import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ProcessUnifiedMessageUseCase } from './process-unified-message.use-case';
import { I_USER_REPOSITORY } from '../../../user/domain/ports/user.repository.interface';
import { LLM_PROVIDER_TOKEN } from '../../../common/llm/llm-provider.interface';
import { I_PROMPT_REPOSITORY } from '../../../common/prompt/domain/ports/prompt.repository.interface';
import { ActionExecutionService } from '../services/action-execution.service';
import { CommandIntentMapper } from '../services/command-intent.mapper';
import { ConversationStateService } from '../services/conversation-state.service';
import { AgentOrchestratorService } from '../../../agent/agent-orchestrator.service';
import { MessageExtractionService } from '../services/message-extraction.service';
import { MediaStandardizationService } from '../services/media-standardization.service';
import { MessageEntity, MessageType } from '../../domain/message.entity';
import { MessagingPlatforms } from '../../../common/messaging/domain/constants/messaging-platforms.enum';
import { LLMIntent } from '../../../common/llm/llm-types';
import { IntentResolverService } from '../services/intent-resolver.service';
import { AnalysisOrchestratorService } from '../services/analysis-orchestrator.service';

    describe('ProcessUnifiedMessageUseCase', () => {
    let useCase: ProcessUnifiedMessageUseCase;
    let mockMessaging: any;
    // mockLLM is used by MediaStandardizationService mock if passed, but here useCase doesn't call it directly for text
    let mockUserRepo: any;
    let mockConversationState: any;
    let mockActionExecution: any;
    let mockAnalysisOrchestrator: any;

    beforeEach(async () => {
        mockMessaging = {
            sendMessage: jest.fn(),
            downloadMedia: jest.fn().mockResolvedValue({ buffer: Buffer.from('audio') }),
            sendInteractiveButtons: jest.fn(),
        };
        mockUserRepo = {
            findByPhoneNumber: jest.fn(),
            findByIdentifier: jest.fn(),
        };
        mockConversationState = {
            getPendingAction: jest.fn(),
            clearPendingAction: jest.fn(),
            // setPendingAction moved to AnalysisOrchestrator usually, but if legacy...
            setPendingAction: jest.fn(), 
        };
        mockActionExecution = {
            execute: jest.fn(),
        };
        mockAnalysisOrchestrator = {
            resolveAnalysis: jest.fn()
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProcessUnifiedMessageUseCase,
                { 
                    provide: MessageExtractionService, 
                    useValue: { 
                        applyHeuristics: jest.fn().mockReturnValue({}) 
                    } 
                },
                { 
                    provide: AnalysisOrchestratorService, 
                    useValue: mockAnalysisOrchestrator
                },
                { provide: I_USER_REPOSITORY, useValue: mockUserRepo },
                { provide: LLM_PROVIDER_TOKEN, useValue: { analyzeText: jest.fn(), transcribeAudio: jest.fn() } }, // still needed for DI resolution
                { provide: I_PROMPT_REPOSITORY, useValue: { getTemplate: jest.fn() } },
                { provide: ActionExecutionService, useValue: mockActionExecution },
                { provide: CommandIntentMapper, useValue: { map: jest.fn() } },
                { provide: ConversationStateService, useValue: mockConversationState },
                { provide: AgentOrchestratorService, useValue: { run: jest.fn() } },
                { provide: MediaStandardizationService, useValue: { transcribeAudio: jest.fn() } },
                {
                    provide: ConfigService,
                    useValue: { get: jest.fn().mockReturnValue('false') }
                },
                IntentResolverService,
            ],
        }).compile();

        useCase = module.get<ProcessUnifiedMessageUseCase>(ProcessUnifiedMessageUseCase);
        
        mockUserRepo.findByIdentifier.mockResolvedValue({ id: 'default_user' });
    });

    const createMessage = (content: string, type: MessageType = MessageType.TEXT, senderId = '123'): MessageEntity => ({
        platform: MessagingPlatforms.TELEGRAM,
        senderId,
        messageId: 'msg_123',
        type,
        content,
        fileId: type !== MessageType.TEXT ? 'file_123' : undefined
    });

    it('should process TEXT message normally', async () => {
        const message = createMessage('Hello');
        mockAnalysisOrchestrator.resolveAnalysis.mockResolvedValue({ 
            intent: LLMIntent.GREETING, 
            data: {}, 
            actions: [{ intent: LLMIntent.GREETING, data: {} }] 
        });
        mockUserRepo.findByIdentifier.mockResolvedValue({});

        await useCase.execute(message, mockMessaging);

        expect(mockAnalysisOrchestrator.resolveAnalysis).toHaveBeenCalledWith('Hello', message, expect.any(Object));
        expect(mockActionExecution.execute).toHaveBeenCalledWith(expect.objectContaining({
            actions: [expect.objectContaining({ intent: LLMIntent.GREETING })]
        }));
    });

    it('should resolve pending AMOUNT using numeric heuristic', async () => {
        const message = createMessage('5000', MessageType.TEXT, '444');
        const mockPending = {
            intent: LLMIntent.CREATE_TRANSACTION,
            data: { type: 'EXPENSE', category: 'Food', amount: 5000 },
            missing_fields: []
        };
        
        // Orchestrator returns the merged result
        mockAnalysisOrchestrator.resolveAnalysis.mockResolvedValue({
            intent: LLMIntent.CREATE_TRANSACTION,
            data: mockPending.data,
            actions: [{ intent: LLMIntent.CREATE_TRANSACTION, data: mockPending.data, missing_fields: [] }]
        });

        mockUserRepo.findByIdentifier.mockResolvedValue({});

        await useCase.execute(message, mockMessaging);

        expect(mockActionExecution.execute).toHaveBeenCalledWith(expect.objectContaining({
            actions: [expect.objectContaining({
                intent: LLMIntent.CREATE_TRANSACTION,
                data: expect.objectContaining({ amount: 5000 }),
                missing_fields: []
            })]
        }));
    });

    it('should resolve pending event_name using heuristic', async () => {
        const message = createMessage('Soirée Blanche', MessageType.TEXT, '777');
        // Orchestrator returns the merged result
        mockAnalysisOrchestrator.resolveAnalysis.mockResolvedValue({
             intent: LLMIntent.CREATE_EVENT,
             data: { date: '2026-06-20', event_name: 'Soirée Blanche' },
             actions: [{ 
                 intent: LLMIntent.CREATE_EVENT, 
                 data: { date: '2026-06-20', event_name: 'Soirée Blanche' },
                 missing_fields: ['capacity', 'price'] 
             }]
        });

        mockUserRepo.findByIdentifier.mockResolvedValue({});

        await useCase.execute(message, mockMessaging);

        expect(mockActionExecution.execute).toHaveBeenCalledWith(expect.objectContaining({
            actions: [expect.objectContaining({
                intent: LLMIntent.CREATE_EVENT,
                data: expect.objectContaining({ event_name: 'Soirée Blanche' }),
                missing_fields: ['capacity', 'price']
            })]
        }));
    });

    it('should handle cancellation keyword', async () => {
        const message = createMessage('Annuler');
        // Orchestrator handles cancellation and returns null or empty actions?
        // Actually Orchestrator probably handles the clearing internally and returns null or specific action.
        // If Orchestrator returns null, use case handles it.
        mockAnalysisOrchestrator.resolveAnalysis.mockResolvedValue(null);
        
        await useCase.execute(message, mockMessaging);

        expect(mockActionExecution.execute).not.toHaveBeenCalled();
    });

    it('should apply cleanup heuristics', async () => {
        const message = createMessage("Le nom de l'événement est Super Fête", MessageType.TEXT, '999');
        mockAnalysisOrchestrator.resolveAnalysis.mockResolvedValue({
             intent: LLMIntent.CREATE_EVENT,
             data: { event_name: 'Super Fête' },
             actions: [{ 
                 intent: LLMIntent.CREATE_EVENT, 
                 data: { event_name: 'Super Fête' }
             }]
        });

        await useCase.execute(message, mockMessaging);

        expect(mockActionExecution.execute).toHaveBeenCalledWith(expect.objectContaining({
             actions: [expect.objectContaining({
                 data: expect.objectContaining({ event_name: 'Super Fête' })
             })]
        }));
    });
});

