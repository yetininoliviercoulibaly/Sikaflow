import { Test, TestingModule } from '@nestjs/testing';
import { ProcessTelegramMessageUseCase } from './process-telegram-message.use-case';
import { TelegramMessagingAdapter } from '../../../common/messaging/telegram-messaging.adapter';
import { TelegramParserService } from '../../infrastructure/telegram/telegram-parser.service';
import { ProcessMessageUseCase } from './process-message.use-case';
import { TelegramUpdateDto } from '../dtos/telegram-payload.dto';
import { MessageType } from '../../domain/unified-message.interface';
import { MessagingPlatforms } from '../../../common/messaging/domain/constants/messaging-platforms.enum';

describe('ProcessTelegramMessageUseCase', () => {
  let useCase: ProcessTelegramMessageUseCase;
  let mockParser: any;
  let mockProcessMessage: any;
  let mockMessaging: any;

  beforeEach(async () => {
    mockParser = { parse: jest.fn() };
    mockProcessMessage = { execute: jest.fn() };
    mockMessaging = { sendMessage: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessTelegramMessageUseCase,
        { provide: TelegramParserService, useValue: mockParser },
        { provide: ProcessMessageUseCase, useValue: mockProcessMessage },
        { provide: TelegramMessagingAdapter, useValue: mockMessaging },
      ],
    }).compile();

    useCase = module.get<ProcessTelegramMessageUseCase>(ProcessTelegramMessageUseCase);
  });

  it('should parse update and delegate to ProcessMessageUseCase', async () => {
    const update = { update_id: 1 } as TelegramUpdateDto;
    const unifiedMsg = { 
        platform: MessagingPlatforms.TELEGRAM,
        senderId: '123', 
        type: MessageType.TEXT, 
        messageId: 'msg1' 
    };

    mockParser.parse.mockReturnValue(unifiedMsg);

    await useCase.execute(update);

    expect(mockParser.parse).toHaveBeenCalledWith(update);
    expect(mockProcessMessage.execute).toHaveBeenCalledWith(unifiedMsg, mockMessaging);
  });

  it('should do nothing if parser returns null', async () => {
    mockParser.parse.mockReturnValue(null);
    await useCase.execute({ update_id: 1 } as TelegramUpdateDto);
    expect(mockProcessMessage.execute).not.toHaveBeenCalled();
  });
});
