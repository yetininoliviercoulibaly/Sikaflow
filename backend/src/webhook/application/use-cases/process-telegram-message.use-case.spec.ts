
import { Test, TestingModule } from '@nestjs/testing';
import { ProcessTelegramMessageUseCase } from './process-telegram-message.use-case';
import { TelegramMessagingAdapter } from '../../../common/messaging/telegram-messaging.adapter';
import { I_USER_REPOSITORY } from '../../../user/domain/ports/user.repository.interface';
import { LLM_PROVIDER_TOKEN } from '../../../common/llm/llm-provider.interface';
import { I_PROMPT_REPOSITORY } from '../../../common/prompt/domain/ports/prompt.repository.interface';
import { ActionExecutionService } from '../services/action-execution.service';
import { CommandIntentMapper } from '../services/command-intent.mapper';
import { ConversationStateService } from '../services/conversation-state.service';
import { TelegramUpdateDto, TelegramMessageDto } from '../dtos/telegram-payload.dto';

describe('ProcessTelegramMessageUseCase', () => {
  let useCase: ProcessTelegramMessageUseCase;
  let mockMessaging: any;
  let mockLLM: any;
  let mockUserRepo: any;
  
  beforeEach(async () => {
    mockMessaging = {
      sendMessage: jest.fn(),
      downloadMedia: jest.fn(),
    };
    mockLLM = {
      analyzeText: jest.fn(),
      transcribeAudio: jest.fn(),
    };
    mockUserRepo = {
      findByPhoneNumber: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessTelegramMessageUseCase,
        { provide: TelegramMessagingAdapter, useValue: mockMessaging },
        { provide: I_USER_REPOSITORY, useValue: mockUserRepo },
        { provide: LLM_PROVIDER_TOKEN, useValue: mockLLM },
        { provide: I_PROMPT_REPOSITORY, useValue: { getTemplate: jest.fn() } },
        { provide: ActionExecutionService, useValue: { execute: jest.fn() } },
        { provide: CommandIntentMapper, useValue: { map: jest.fn() } },
        { provide: ConversationStateService, useValue: { getPendingAction: jest.fn(), clearPendingAction: jest.fn(), setPendingAction: jest.fn() } },
      ],
    }).compile();

    useCase = module.get<ProcessTelegramMessageUseCase>(ProcessTelegramMessageUseCase);
  });

  it('should process TEXT message normally', async () => {
    const update = {
      update_id: 1,
      message: {
        message_id: 123,
        chat: { id: 111, type: 'private' },
        from: { id: 111, first_name: 'Test', is_bot: false },
        date: 123456,
        text: 'Hello'
      } as TelegramMessageDto
    } as TelegramUpdateDto;

    mockLLM.analyzeText.mockResolvedValue({ intent: 'GREETING', data: {} });
    mockUserRepo.findByPhoneNumber.mockResolvedValue({});

    await useCase.execute(update);

    expect(mockLLM.analyzeText).toHaveBeenCalledWith('Hello', expect.any(Object));
    expect(mockMessaging.downloadMedia).not.toHaveBeenCalled();
  });

  it('should process VOICE message by downloading and transcribing', async () => {
    const update = {
      update_id: 2,
      message: {
        message_id: 124,
        chat: { id: 222, type: 'private' },
        from: { id: 222, first_name: 'VoiceUser', is_bot: false },
        date: 123456,
        voice: {
          file_id: 'voice_file_123',
          file_unique_id: 'uid',
          duration: 10
        }
      } as TelegramMessageDto
    } as TelegramUpdateDto;

    // Mocks
    mockMessaging.downloadMedia.mockResolvedValue({ buffer: Buffer.from('fake_audio'), filename: 'voice.ogg' });
    mockLLM.transcribeAudio.mockResolvedValue('Ceci est un test vocal');
    mockLLM.analyzeText.mockResolvedValue({ intent: 'TEST_INTENT', data: {} });
    mockUserRepo.findByPhoneNumber.mockResolvedValue({});

    await useCase.execute(update);

    // Verify Download
    expect(mockMessaging.downloadMedia).toHaveBeenCalledWith('voice_file_123');
    
    // Verify Transcribe
    expect(mockLLM.transcribeAudio).toHaveBeenCalledWith(
        Buffer.from('fake_audio').toString('base64'), 
        'audio/ogg'
    );

    // Verify Analysis of TRANSCRIBED text
    expect(mockLLM.analyzeText).toHaveBeenCalledWith('Ceci est un test vocal', expect.any(Object));
  });

  it('should handle unclear audio', async () => {
    const update = {
      update_id: 3,
      message: {
        message_id: 125,
        chat: { id: 333, type: 'private' },
        from: { id: 333, first_name: 'VoiceUser', is_bot: false },
        voice: { file_id: 'bad_file', file_unique_id: 'uid', duration: 5 }
      } as TelegramMessageDto
    } as TelegramUpdateDto;

    mockMessaging.downloadMedia.mockResolvedValue({ buffer: Buffer.from('bad'), filename: 'voice.ogg' });
    mockLLM.transcribeAudio.mockResolvedValue('Audio unclear');

    await useCase.execute(update);

    expect(mockMessaging.sendMessage).toHaveBeenCalledWith('333', expect.stringContaining('Audio incompréhensible'));
    expect(mockLLM.analyzeText).not.toHaveBeenCalled();
  });

  it('should resolve pending AMOUNT using numeric heuristic', async () => {
       const chatId = 444;
       const update = {
         update_id: 4,
         message: {
           message_id: 126,
           chat: { id: chatId, type: 'private' },
           from: { id: 444, first_name: 'NumUser', is_bot: false },
           text: '5000'
         } as TelegramMessageDto
       } as TelegramUpdateDto;

       // Mock Pending State needing amount
       const mockPending = {
           intent: 'CREATE_TRANSACTION',
           data: { type: 'EXPENSE', category: 'Food' },
           missing_fields: ['amount']
       };

       // Mock LLM returning NO intent (simulating failure to extract context)
       mockLLM.analyzeText.mockResolvedValue({ intent: null, data: {} });
       mockUserRepo.findByPhoneNumber.mockResolvedValue({});
       
       // Mock Conversation State
       const conversationService = (useCase as any).conversationState;
       conversationService.getPendingAction.mockReturnValue(mockPending);

       await useCase.execute(update);

       // Expect ActionExecution to receive collected amount
       const actionService = (useCase as any).actionExecutionService;
       expect(actionService.execute).toHaveBeenCalledWith(expect.objectContaining({
           actions: [expect.objectContaining({
               intent: 'CREATE_TRANSACTION',
               data: expect.objectContaining({ amount: 5000 }),
               missing_fields: [] // Should be empty now
           })]
       }));
       
       // Expect Clear Pending to be called (since all fields collected)
       expect(conversationService.clearPendingAction).toHaveBeenCalledWith('444');
  });

  it('should resolve pending AMOUNT using regex for input with units (e.g. 50 euros)', async () => {
       const chatId = 555;
       const update = {
         update_id: 5,
         message: {
           message_id: 127,
           chat: { id: chatId, type: 'private' },
           from: { id: 555, first_name: 'UnitUser', is_bot: false },
           text: '50 euros'
         } as TelegramMessageDto
       } as TelegramUpdateDto;

       const mockPending = {
           intent: 'CREATE_TRANSACTION',
           data: { type: 'EXPENSE' },
           missing_fields: ['amount']
       };

       mockLLM.analyzeText.mockResolvedValue({ intent: null, data: {} });
       mockUserRepo.findByPhoneNumber.mockResolvedValue({});
       
       const conversationService = (useCase as any).conversationState;
       conversationService.getPendingAction.mockReturnValue(mockPending);

       await useCase.execute(update);

       const actionService = (useCase as any).actionExecutionService;
       expect(actionService.execute).toHaveBeenCalledWith(expect.objectContaining({
           actions: [expect.objectContaining({
               intent: 'CREATE_TRANSACTION',
               data: expect.objectContaining({ amount: 50 }),
               missing_fields: [] 
           })]
       }));
  });
  it('should apply heuristic to extract period matching "Aujourd\'hui"', async () => {
    const chatId = 666;
    const update = {
      update_id: 6,
      message: {
        message_id: 128,
        chat: { id: chatId, type: 'private' },
        from: { id: 666, first_name: 'PeriodUser', is_bot: false },
        text: "Aujourd'hui"
      } as TelegramMessageDto
    } as TelegramUpdateDto;

    const mockPending = {
      intent: 'ASK_DATA',
      data: { metric: 'NET_PROFIT' },
      missing_fields: ['period'],
      createdAt: new Date(),
    };

    mockLLM.analyzeText.mockResolvedValue({ intent: null, data: {} });
    mockUserRepo.findByPhoneNumber.mockResolvedValue({});

    const conversationService = (useCase as any).conversationState;
    conversationService.getPendingAction.mockReturnValue(mockPending);

    await useCase.execute(update);

    const actionService = (useCase as any).actionExecutionService;
    expect(actionService.execute).toHaveBeenCalledWith(expect.objectContaining({
      actions: [expect.objectContaining({
        intent: 'ASK_DATA',
        data: expect.objectContaining({
          metric: 'NET_PROFIT',
          period: 'today'
        })
      })]
    }));

    expect(conversationService.clearPendingAction).toHaveBeenCalledWith('666');
  });

  it('should resolve pending event_name using heuristic for CREATE_EVENT', async () => {
    const chatId = 777;
    const update = {
      update_id: 7,
      message: {
        message_id: 129,
        chat: { id: chatId, type: 'private' },
        from: { id: 777, first_name: 'EventUser', is_bot: false },
        text: "Soirée Blanche"
      } as TelegramMessageDto
    } as TelegramUpdateDto;

    const mockPending = {
      intent: 'CREATE_EVENT',
      data: { date: '2026-06-20' },
      missing_fields: ['event_name', 'capacity', 'price'],
    };

    mockLLM.analyzeText.mockResolvedValue({ intent: null, data: {} });
    mockUserRepo.findByPhoneNumber.mockResolvedValue({});

    const conversationService = (useCase as any).conversationState;
    conversationService.getPendingAction.mockReturnValue(mockPending);

    await useCase.execute(update);

    const actionService = (useCase as any).actionExecutionService;
    expect(actionService.execute).toHaveBeenCalledWith(expect.objectContaining({
      actions: [expect.objectContaining({
        intent: 'CREATE_EVENT',
        data: expect.objectContaining({
          event_name: 'Soirée Blanche'
        }),
        missing_fields: ['capacity', 'price']
      })]
    }));
  });

  it('should resolve pending event_name using heuristic for GENERATE_CLAIM_LINKS', async () => {
    const chatId = 888;
    const update = {
      update_id: 8,
      message: {
        message_id: 130,
        chat: { id: chatId, type: 'private' },
        from: { id: 888, first_name: 'TicketUser', is_bot: false },
        text: "Gala de Charité"
      } as TelegramMessageDto
    } as TelegramUpdateDto;

    const mockPending = {
      intent: 'GENERATE_CLAIM_LINKS',
      data: { quantity: 5 },
      missing_fields: ['event_name'],
    };

    mockLLM.analyzeText.mockResolvedValue({ intent: null, data: {} });
    mockUserRepo.findByPhoneNumber.mockResolvedValue({});

    const conversationService = (useCase as any).conversationState;
    conversationService.getPendingAction.mockReturnValue(mockPending);

    await useCase.execute(update);

    const actionService = (useCase as any).actionExecutionService;
    expect(actionService.execute).toHaveBeenCalledWith(expect.objectContaining({
      actions: [expect.objectContaining({
        intent: 'GENERATE_CLAIM_LINKS',
        data: expect.objectContaining({
          event_name: 'Gala de Charité'
        })
      })]
    }));

    expect(conversationService.clearPendingAction).toHaveBeenCalledWith('888');
  });

  it('should cleanup names with common French prefixes', async () => {
    const chatId = 999;
    const update = {
      update_id: 9,
      message: {
        message_id: 131,
        chat: { id: chatId, type: 'private' },
        from: { id: 999, first_name: 'PrefixUser', is_bot: false },
        text: "Le nom de l'événement est Événement Olivier"
      } as TelegramMessageDto
    } as TelegramUpdateDto;

    const mockPending = {
      intent: 'CREATE_EVENT',
      data: {},
      missing_fields: ['event_name'],
    };

    mockLLM.analyzeText.mockResolvedValue({ intent: null, data: {} });
    mockUserRepo.findByPhoneNumber.mockResolvedValue({});

    const conversationService = (useCase as any).conversationState;
    conversationService.getPendingAction.mockReturnValue(mockPending);

    await useCase.execute(update);

    const actionService = (useCase as any).actionExecutionService;
    expect(actionService.execute).toHaveBeenCalledWith(expect.objectContaining({
      actions: [expect.objectContaining({
        data: expect.objectContaining({
          event_name: 'Événement Olivier'
        })
      })]
    }));
    
    // Should clear since all fields were filled (only event_name was missing)
    expect(conversationService.clearPendingAction).toHaveBeenCalledWith('999');
  });

  it('should extract date when CREATE_EVENT is pending and LLM fails', async () => {
    const chatId = 777;
    const update = {
      update_id: 10,
      message: {
        message_id: 141,
        chat: { id: chatId, type: 'private' },
        from: { id: 777, first_name: 'DateUser', is_bot: false },
        text: "Le 20 février 2026"
      } as TelegramMessageDto
    } as TelegramUpdateDto;

    const mockPending = {
      intent: 'CREATE_EVENT',
      data: { event_name: 'Concert' },
      missing_fields: ['date', 'capacity', 'price'],
    };

    mockLLM.analyzeText.mockResolvedValue({ intent: null, data: {} });
    mockUserRepo.findByPhoneNumber.mockResolvedValue({});

    const conversationService = (useCase as any).conversationState;
    conversationService.getPendingAction.mockReturnValue(mockPending);

    await useCase.execute(update);

    const actionService = (useCase as any).actionExecutionService;
    expect(actionService.execute).toHaveBeenCalledWith(expect.objectContaining({
      actions: [expect.objectContaining({
        data: expect.objectContaining({
          date: '20 février 2026'
        }),
        missing_fields: ['capacity', 'price']
      })]
    }));
    
    // Should NOT clear since capacity and price are still missing
    expect(conversationService.clearPendingAction).not.toHaveBeenCalled();
    // Should update pending with the extracted date
    expect(conversationService.setPendingAction).toHaveBeenCalledWith('777', expect.objectContaining({
        data: expect.objectContaining({ date: '20 février 2026' })
    }));
  });

  it('should extract capacity when CREATE_EVENT is pending and LLM fails', async () => {
    const chatId = 666;
    const update = {
      update_id: 11,
      message: {
        message_id: 151,
        chat: { id: chatId, type: 'private' },
        from: { id: 666, first_name: 'CapUser', is_bot: false },
        text: "100"
      } as TelegramMessageDto
    } as TelegramUpdateDto;

    const mockPending = {
      intent: 'CREATE_EVENT',
      data: { event_name: 'Concert', date: '2026-02-20' },
      missing_fields: ['capacity', 'price'],
    };

    mockLLM.analyzeText.mockResolvedValue({ intent: null, data: {} });
    mockUserRepo.findByPhoneNumber.mockResolvedValue({});

    const conversationService = (useCase as any).conversationState;
    conversationService.getPendingAction.mockReturnValue(mockPending);

    await useCase.execute(update);

    const actionService = (useCase as any).actionExecutionService;
    expect(actionService.execute).toHaveBeenCalledWith(expect.objectContaining({
      actions: [expect.objectContaining({
        data: expect.objectContaining({
          capacity: '100'
        }),
        missing_fields: ['price']
      })]
    }));
  });
  it('should parse relative date "Aujourd\'hui" correctly', async () => {
    const chatId = 1010;
    const update = {
      update_id: 12,
      message: {
        message_id: 161,
        chat: { id: chatId, type: 'private' },
        from: { id: 1010, first_name: 'RelDateUser', is_bot: false },
        text: "Aujourd'hui"
      } as TelegramMessageDto
    } as TelegramUpdateDto;

    const mockPending = {
      intent: 'CREATE_EVENT',
      data: { event_name: 'Test Event' },
      missing_fields: ['date'],
    };

    mockLLM.analyzeText.mockResolvedValue({ intent: null, data: {} });
    mockUserRepo.findByPhoneNumber.mockResolvedValue({});

    const conversationService = (useCase as any).conversationState;
    conversationService.getPendingAction.mockReturnValue(mockPending);

    await useCase.execute(update);

    const actionService = (useCase as any).actionExecutionService;
    // We expect the date to be converted to ISO format (YYYY-MM-DD)
    // Since we can't predict the exact date in test without mocking Date, 
    // we just check it matched the regex YYYY-MM-DD
    expect(actionService.execute).toHaveBeenCalledWith(expect.objectContaining({
      actions: [expect.objectContaining({
        data: expect.objectContaining({
          date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/)
        })
      })]
    }));
  });

  it('should extract contact_name when ADD_DEBT is pending and LLM fails', async () => {
    const chatId = 12345;
    const update = {
      update_id: 13,
      message: {
        message_id: 171,
        chat: { id: chatId, type: 'private' },
        from: { id: 12345, first_name: 'DebtUser', is_bot: false },
        text: "Aurore"
      } as TelegramMessageDto
    } as TelegramUpdateDto;

    const mockPending = {
      intent: 'ADD_DEBT',
      data: { amount: 5000 },
      missing_fields: ['contact_name'],
    };

    mockLLM.analyzeText.mockResolvedValue({ intent: null, data: {} });
    mockUserRepo.findByPhoneNumber.mockResolvedValue({});

    const conversationService = (useCase as any).conversationState;
    conversationService.getPendingAction.mockReturnValue(mockPending);

    await useCase.execute(update);

    const actionService = (useCase as any).actionExecutionService;
    expect(actionService.execute).toHaveBeenCalledWith(expect.objectContaining({
      actions: [expect.objectContaining({
        data: expect.objectContaining({
          contact_name: 'Aurore'
        }),
        missing_fields: []
      })]
    }));

    // Should clear since all fields were filled
    expect(conversationService.clearPendingAction).toHaveBeenCalledWith('12345');
  });
});
