import { Test, TestingModule } from '@nestjs/testing';
import { CancelLastActionHandler } from '../../application/handlers/cancel-last-action.handler';
import { GetLastTransactionUseCase } from '../../../transaction/application/use-cases/get-last-transaction.use-case';
import { ActionContext } from '../../application/handlers/action-handler.interface';
import { IMessagingService } from '../../../common/messaging/messaging.service.interface';
import { MessagingPlatforms } from '../../../common/messaging/domain/constants/messaging-platforms.enum';
import { LLMIntent } from '../../../common/llm/llm-types';

describe('CancelLastActionHandler', () => {
  let handler: CancelLastActionHandler;
  let getLastTransactionUseCase: GetLastTransactionUseCase;
  let messagingService: IMessagingService;

  const mockGetLastTransactionUseCase = {
    execute: jest.fn(),
  };

  const mockMessagingService = {
    sendMessage: jest.fn(),
    sendInteractiveButtons: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CancelLastActionHandler,
        {
          provide: GetLastTransactionUseCase,
          useValue: mockGetLastTransactionUseCase,
        },
      ],
    }).compile();

    handler = module.get<CancelLastActionHandler>(CancelLastActionHandler);
    getLastTransactionUseCase = module.get<GetLastTransactionUseCase>(GetLastTransactionUseCase);
    mockMessagingService.sendMessage = jest.fn();
    mockMessagingService.sendInteractiveButtons = jest.fn();
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should handle CANCEL_LAST_ACTION intent', () => {
    expect(handler.canHandle(LLMIntent.CANCEL_LAST_ACTION)).toBe(true);
    expect(handler.canHandle('OTHER_INTENT')).toBe(false);
  });

  it('should send "not found" message if no transaction exists', async () => {
    mockGetLastTransactionUseCase.execute.mockResolvedValue(null);

    const context: ActionContext = {
      senderPhoneNumber: '123456789',
      messagingService: mockMessagingService as any,
      platform: MessagingPlatforms.TELEGRAM,
      messageId: '1',
      organizationId: 'org1',
    };

    await handler.handle({}, context);

    expect(mockGetLastTransactionUseCase.execute).toHaveBeenCalledWith({ phoneNumber: '123456789' });
    expect(mockMessagingService.sendMessage).toHaveBeenCalledWith(
        '123456789', 
        expect.stringContaining('Aucune transaction récente trouvée')
    );
  });

  it('should send confirmation buttons if transaction exists', async () => {
    const mockTransaction = {
        id: 'tx-123',
        amount: 50,
        currency: 'EUR',
        category: 'Taxi',
        transactionDate: new Date('2024-01-01'),
    };
    mockGetLastTransactionUseCase.execute.mockResolvedValue(mockTransaction);

    const context: ActionContext = {
      senderPhoneNumber: '123456789',
      messagingService: mockMessagingService as any,
      platform: MessagingPlatforms.TELEGRAM,
      messageId: '1',
      organizationId: 'org1',
    };

    await handler.handle({}, context);

    expect(mockMessagingService.sendInteractiveButtons).toHaveBeenCalledWith(
        '123456789',
        expect.stringContaining('50 EUR'),
        expect.arrayContaining([
            expect.objectContaining({ id: 'CONFIRM_DEL|YES|tx-123' }),
            expect.objectContaining({ id: 'CONFIRM_DEL|NO' })
        ])
    );
  });
});
