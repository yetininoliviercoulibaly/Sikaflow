import { Test, TestingModule } from '@nestjs/testing';
import { ExecuteDeletionHandler } from '../../application/handlers/execute-deletion.handler';
import { DeleteTransactionUseCase } from '../../../transaction/application/use-cases/delete-transaction.use-case';
import { ActionContext } from '../../application/handlers/action-handler.interface';
import { IMessagingService } from '../../../common/messaging/messaging.service.interface';
import { MessagingPlatforms } from '../../../common/messaging/domain/constants/messaging-platforms.enum';
import { LLMIntent } from '../../../common/llm/llm-types';

describe('ExecuteDeletionHandler', () => {
  let handler: ExecuteDeletionHandler;
  let deleteTransactionUseCase: DeleteTransactionUseCase;
  let messagingService: IMessagingService;

  const mockDeleteTransactionUseCase = {
    execute: jest.fn(),
  };

  const mockMessagingService = {
    sendMessage: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
        providers: [
            ExecuteDeletionHandler,
            {
                provide: DeleteTransactionUseCase,
                useValue: mockDeleteTransactionUseCase,
            },
        ],
    }).compile();

    handler = module.get<ExecuteDeletionHandler>(ExecuteDeletionHandler);
    deleteTransactionUseCase = module.get<DeleteTransactionUseCase>(DeleteTransactionUseCase);
    mockMessagingService.sendMessage = jest.fn();
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should handle EXECUTE_DELETION intent', () => {
    expect(handler.canHandle(LLMIntent.EXECUTE_DELETION)).toBe(true);
  });

  it('should call delete use case and success message', async () => {
    mockDeleteTransactionUseCase.execute.mockResolvedValue(undefined); // Success

    const context: ActionContext = {
      senderPhoneNumber: '123456789',
      messagingService: mockMessagingService as any,
      platform: MessagingPlatforms.TELEGRAM,
      messageId: '1',
      organizationId: 'org1',
    };

    await handler.handle({ transactionId: 'tx-123' }, context);

    expect(mockDeleteTransactionUseCase.execute).toHaveBeenCalledWith({ transactionId: 'tx-123' });
    expect(mockMessagingService.sendMessage).toHaveBeenCalledWith(
        '123456789',
        expect.stringContaining('succès')
    );
  });

  it('should handle errors gracefully', async () => {
    mockDeleteTransactionUseCase.execute.mockRejectedValue(new Error('DB Error'));

    const context: ActionContext = {
      senderPhoneNumber: '123456789',
      messagingService: mockMessagingService as any,
      platform: MessagingPlatforms.TELEGRAM,
      messageId: '1',
      organizationId: 'org1',
    };

    await handler.handle({ transactionId: 'tx-123' }, context);

    expect(mockMessagingService.sendMessage).toHaveBeenCalledWith(
        '123456789',
        expect.stringContaining('erreur')
    );
  });
});
