import { Test, TestingModule } from '@nestjs/testing';
import { ActionExecutionService, ActionExecutionParams } from '../../application/services/action-execution.service';
import { ACTION_HANDLER_TOKEN, IActionHandler } from '../../application/handlers/action-handler.interface';
import { CheckSubscriptionUseCase } from '../../../subscription/application/use-cases/check-subscription.use-case';
import { IMessagingService } from '../../../common/messaging/messaging.service.interface';
import { User } from '../../../user/domain/user.entity';

describe('ActionExecutionService', () => {
  let service: ActionExecutionService;
  let mockMessagingService: jest.Mocked<IMessagingService>;
  let mockCheckSubscriptionUseCase: jest.Mocked<CheckSubscriptionUseCase>;
  let mockHandler: jest.Mocked<IActionHandler>;

  beforeEach(async () => {
    mockMessagingService = {
      sendMessage: jest.fn(),
      sendDocument: jest.fn(),
      sendInteractiveButtons: jest.fn(),
      sendInteractiveList: jest.fn(),
      downloadMedia: jest.fn(),
    };

    mockCheckSubscriptionUseCase = {
      execute: jest.fn(),
    } as any;

    mockHandler = {
        canHandle: jest.fn(),
        handle: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActionExecutionService,
        {
          provide: ACTION_HANDLER_TOKEN,
          useValue: [mockHandler],
        },
        {
            provide: CheckSubscriptionUseCase,
            useValue: mockCheckSubscriptionUseCase,
        }
      ],
    }).compile();

    service = module.get<ActionExecutionService>(ActionExecutionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should executes handler successfully when subscription is valid', async () => {
    const params: ActionExecutionParams = {
        actions: [{ intent: 'TEST_INTENT', data: { foo: 'bar' } }],
        messagingService: mockMessagingService,
        user: { lastActiveOrganizationId: 'org1', preferredLanguage: 'fr' } as User,
        senderPhoneNumber: '+123',
        messageId: 'msg1',
        messageBody: 'test',
        platform: 'whatsapp'
    };

    mockCheckSubscriptionUseCase.execute.mockResolvedValue({ hasAccess: true, planName: 'Test' } as any);
    mockHandler.canHandle.mockReturnValue(true);

    await service.execute(params);

    expect(mockCheckSubscriptionUseCase.execute).toHaveBeenCalledWith({ organizationId: 'org1' });
    expect(mockHandler.handle).toHaveBeenCalled();
  });

  it('should block execution if subscription is expired', async () => {
    const params: ActionExecutionParams = {
        actions: [{ intent: 'TEST_INTENT' }],
        messagingService: mockMessagingService,
        user: { lastActiveOrganizationId: 'org1' } as User,
        senderPhoneNumber: '+123',
        messageId: 'msg1',
        platform: 'whatsapp'
    };

    mockCheckSubscriptionUseCase.execute.mockResolvedValue({ hasAccess: false, planName: 'Test' } as any);

    await service.execute(params);

    expect(mockMessagingService.sendMessage).toHaveBeenCalledWith(expect.stringContaining('+123'), expect.stringContaining('Accès expiré'));
    expect(mockHandler.handle).not.toHaveBeenCalled();
  });

  it('should bypass subscription check for specific intents', async () => {
    const params: ActionExecutionParams = {
        actions: [{ intent: 'GREETING' }],
        messagingService: mockMessagingService,
        user: { lastActiveOrganizationId: 'org1' } as User, // Even with org, it should skip check
        senderPhoneNumber: '+123',
        messageId: 'msg1',
        platform: 'whatsapp'
    };

    mockHandler.canHandle.mockReturnValue(true);

    await service.execute(params);

    expect(mockCheckSubscriptionUseCase.execute).not.toHaveBeenCalled();
    expect(mockHandler.handle).toHaveBeenCalled();
  });

  it('should report missing fields', async () => {
    const params: ActionExecutionParams = {
        actions: [{ intent: 'TEST', missing_fields: ['date'] }],
        messagingService: mockMessagingService,
        user: null,
        senderPhoneNumber: '+123',
        messageId: 'msg1',
        platform: 'telegram'
    };

    await service.execute(params);

    expect(mockMessagingService.sendMessage).toHaveBeenCalledWith(expect.stringContaining('+123'), expect.stringContaining('Il manque des informations'));
    expect(mockHandler.handle).not.toHaveBeenCalled();
  });

  it('should find and execute handler for UNKNOWN intent', async () => {
    const params: ActionExecutionParams = {
        actions: [{ intent: 'UNKNOWN' }],
        messagingService: mockMessagingService,
        user: { lastActiveOrganizationId: 'org1' } as User,
        senderPhoneNumber: '+123',
        messageId: 'msg1',
        platform: 'whatsapp'
    };

    mockHandler.canHandle.mockImplementation((intent) => intent === 'UNKNOWN');

    await service.execute(params);

    expect(mockHandler.canHandle).toHaveBeenCalledWith('UNKNOWN');
    expect(mockHandler.handle).toHaveBeenCalled();
  });
});
