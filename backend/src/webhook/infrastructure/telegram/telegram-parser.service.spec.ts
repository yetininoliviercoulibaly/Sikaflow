import { Test, TestingModule } from '@nestjs/testing';
import { TelegramParserService } from './telegram-parser.service';
import { MessagingPlatforms } from '../../../common/messaging/domain/constants/messaging-platforms.enum';
import { MessageType } from '../../domain/message.entity';
import { TelegramUpdateDto } from '../../application/dtos/telegram-payload.dto';

describe('TelegramParserService', () => {
  let service: TelegramParserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TelegramParserService],
    }).compile();

    service = module.get<TelegramParserService>(TelegramParserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('parse', () => {
    it('should parse callback_query correctly', () => {
      const update: TelegramUpdateDto = {
        update_id: 12345,
        callback_query: {
            id: 'cb_123',
            from: { id: 999, first_name: 'John', is_bot: false, username: 'john_doe' },
            message: {
                message_id: 1001,
                date: 1672531200,
                chat: { id: 999, type: 'private' }
            },
            chat_instance: 'instance_1',
            data: 'ACTION_CLICKED'
        }
      };

      const result = service.parse(update);

      expect(result).toBeDefined();
      expect(result?.platform).toBe(MessagingPlatforms.TELEGRAM);
      expect(result?.type).toBe(MessageType.TEXT);
      expect(result?.content).toBe('ACTION_CLICKED');
      expect(result?.callbackData).toBe('ACTION_CLICKED');
      expect(result?.senderId).toBe('999');
    });

    // ... (rest of tests)

    it('should return null for ignored updates (e.g. edited_message)', () => {
        const update = {
            update_id: 12345,
            edited_message: {
                message_id: 2005,
                date: 1672531200,
                chat: { id: 666, type: 'private' },
                text: 'Edited text'
            }
        } as unknown as TelegramUpdateDto;

        const result = service.parse(update);

        expect(result).toBeNull();
    });
  });
});
