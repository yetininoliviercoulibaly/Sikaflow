
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
        { provide: ConversationStateService, useValue: { getPendingAction: jest.fn(), clearPendingAction: jest.fn() } },
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
});
