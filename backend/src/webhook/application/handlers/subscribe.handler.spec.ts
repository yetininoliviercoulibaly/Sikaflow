
import { Test, TestingModule } from '@nestjs/testing';
import { SubscribeHandler } from './subscribe.handler';
import { SubscribeUseCase } from '../../../subscription/application/use-cases/subscribe.use-case';
import { ConversationStateService } from '../services/conversation-state.service';
import { LLMIntent } from '../../../common/llm/llm-types';

describe('SubscribeHandler', () => {
  let handler: SubscribeHandler;
  let subscribeUseCase: SubscribeUseCase;
  let conversationStateService: ConversationStateService;
  let messagingService: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscribeHandler,
        {
          provide: SubscribeUseCase,
          useValue: {
            getPlansData: jest.fn(),
            execute: jest.fn(),
            getPaymentMethods: jest.fn(),
          },
        },
        {
          provide: ConversationStateService,
          useValue: {
            setPendingAction: jest.fn(),
            clearPendingAction: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<SubscribeHandler>(SubscribeHandler);
    subscribeUseCase = module.get<SubscribeUseCase>(SubscribeUseCase);
    conversationStateService = module.get<ConversationStateService>(ConversationStateService);
    messagingService = {
        sendMessage: jest.fn(),
    };
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should list plans and set pending action if duration is missing', async () => {
      const plans = [
          { id: '1', name: 'Plan 1', durationMonths: 3, price: 1000, currency: 'XOF' },
          { id: '2', name: 'Plan 2', durationMonths: 12, price: 5000, currency: 'XOF' }
      ];
      (subscribeUseCase.getPlansData as jest.Mock).mockResolvedValue(plans);

      await handler.handle(
          { provider: 'WAVE' },
          {
              senderPhoneNumber: '123',
              organizationId: 'org1',
              messagingService,
              messageId: '1',
              platform: 0 as any,
              missingFields: [],
              messageBody: 'Wave'
          }
      );

      expect(subscribeUseCase.getPlansData).toHaveBeenCalledWith('WAVE');
      expect(messagingService.sendMessage).toHaveBeenCalled();
      expect(conversationStateService.setPendingAction).toHaveBeenCalledWith('123', {
          intent: LLMIntent.SUBSCRIBE,
          data: { provider: 'WAVE' },
          missing_fields: ['duration'],
          createdAt: expect.any(Date)
      });
  });

  it('should select plan by index "1"', async () => {
      const plans = [
          { id: '1', name: 'Plan 1', durationMonths: 3, price: 1000, currency: 'XOF' },
          { id: '2', name: 'Plan 2', durationMonths: 12, price: 5000, currency: 'XOF' }
      ];
      (subscribeUseCase.getPlansData as jest.Mock).mockResolvedValue(plans);
      (subscribeUseCase.execute as jest.Mock).mockResolvedValue({ paymentLink: 'http://link' });

      await handler.handle(
          { provider: 'WAVE', duration: '1' },
          {
              senderPhoneNumber: '123',
              organizationId: 'org1',
              messagingService,
              messageId: '1',
              platform: 0 as any,
              missingFields: [],
              messageBody: '1'
          }
      );

      expect(subscribeUseCase.execute).toHaveBeenCalledWith('1', 'org1');
      expect(conversationStateService.clearPendingAction).toHaveBeenCalledWith('123');
  });

  it('should select plan by duration "3"', async () => {
      const plans = [
          { id: '1', name: 'Plan 1', durationMonths: 3, price: 1000, currency: 'XOF' },
          { id: '2', name: 'Plan 2', durationMonths: 12, price: 5000, currency: 'XOF' }
      ];
      (subscribeUseCase.getPlansData as jest.Mock).mockResolvedValue(plans);
      (subscribeUseCase.execute as jest.Mock).mockResolvedValue({ paymentLink: 'http://link' });

      await handler.handle(
          { provider: 'WAVE', duration: '3' },
          {
              senderPhoneNumber: '123',
              organizationId: 'org1',
              messagingService,
              messageId: '1',
              platform: 0 as any,
              missingFields: [],
              messageBody: '3'
          }
      );

      expect(subscribeUseCase.execute).toHaveBeenCalledWith('1', 'org1'); // Plan 1 has 3 months
  });
});
