import { Test, TestingModule } from '@nestjs/testing';
import { TelegramMessagingAdapter } from './telegram-messaging.adapter';
import { I_TELEGRAM_SERVICE, ITelegramService } from '../telegram/telegram.service.interface';
import { IMessageButton, IMessageSection } from './messaging.service.interface';

describe('TelegramMessagingAdapter', () => {
  let adapter: TelegramMessagingAdapter;
  let mockTelegramService: any;

  beforeEach(async () => {
    mockTelegramService = {
      sendMessage: jest.fn(),
      sendInlineKeyboard: jest.fn(),
      sendDocument: jest.fn(),
      downloadFile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelegramMessagingAdapter,
        { provide: I_TELEGRAM_SERVICE, useValue: mockTelegramService },
      ],
    }).compile();

    adapter = module.get<TelegramMessagingAdapter>(TelegramMessagingAdapter);
  });

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });

  it('should send simple text', async () => {
    await adapter.sendMessage('123', 'Hello');
    expect(mockTelegramService.sendMessage).toHaveBeenCalledWith('123', 'Hello');
  });

  it('should map interactive buttons to inline keyboard', async () => {
    const buttons: IMessageButton[] = [
      { id: 'btn1', title: 'Option 1' },
      { id: 'btn2', title: 'Option 2' },
    ];

    await adapter.sendInteractiveButtons('123', 'Choose:', buttons);

    expect(mockTelegramService.sendInlineKeyboard).toHaveBeenCalledWith(
        '123',
        'Choose:',
        // Expecting [ [{text, callback_data}], [{text, callback_data}] ] -> Rows of 1 button by default in adapter?
        // Let's check adapter implementation. It mapped buttons.map(b => ([{...}])) which means 1 button per row (vertical list).
        expect.arrayContaining([
            expect.arrayContaining([expect.objectContaining({ text: 'Option 1', callback_data: 'btn1' })]),
            expect.arrayContaining([expect.objectContaining({ text: 'Option 2', callback_data: 'btn2' })]),
        ])
    );
  });

  it('should flatten interactive list sections into button rows', async () => {
    const sections: IMessageSection[] = [
        {
            title: 'Section 1',
            rows: [ { id: 'row1', title: 'Item 1' } ]
        },
        {
            title: 'Section 2',
            rows: [ { id: 'row2', title: 'Item 2', description: 'Desc' } ]
        }
    ];

    await adapter.sendInteractiveList('123', 'Header', 'Body', 'Btn', sections);

    // Context: "Telegram doesn't have native list support like WhatsApp... Convert to inline keyboard"
    const expectedBody = '*Header*\n\nBody';
    
    expect(mockTelegramService.sendInlineKeyboard).toHaveBeenCalledWith(
        '123',
        expectedBody,
        expect.any(Array)
    );

    const callArgs = mockTelegramService.sendInlineKeyboard.mock.calls[0];
    const keyboard = callArgs[2];

    // Check grouping
    // implementation was: sections.flatMap(section => section.rows.map(row => ([{...}])))
    // So 1 button per row again.
    expect(keyboard).toHaveLength(2);
    expect(keyboard[0][0]).toEqual(expect.objectContaining({ text: 'Item 1', callback_data: 'row1' }));
    expect(keyboard[1][0]).toEqual(expect.objectContaining({ text: 'Item 2 - Desc', callback_data: 'row2' }));
  });
});
