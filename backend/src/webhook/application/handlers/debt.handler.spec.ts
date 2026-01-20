
import { Test, TestingModule } from '@nestjs/testing';
import { DebtHandler } from './debt.handler';
import { I_CONTACT_REPOSITORY } from '../../../contact/domain/ports/contact.repository.interface';
import { ContactService } from '../../../contact/application/services/contact.service';
import { PAYMENT_PROVIDER_TOKEN } from '../../../payment/domain/ports/payment-provider.interface';
import { DebtIntents } from '../constants/debt.constants';
import { MessagingPlatforms } from '../../../common/messaging/domain/constants/messaging-platforms.enum';
import { ActionContext } from './action-handler.interface';

describe('DebtHandler', () => {
  let handler: DebtHandler;
  let mockContactRepo: any;
  let mockContactService: any;
  let mockPaymentProvider: any;
  let mockMessaging: any;

  beforeEach(async () => {
    mockContactRepo = {
      searchByName: jest.fn(),
      findWithPendingDebts: jest.fn(),
      findByOwner: jest.fn(),
    };
    mockContactService = {
      addDebt: jest.fn(),
      addCredit: jest.fn(),
      settleDebt: jest.fn(),
    };
    mockPaymentProvider = {
      createPaymentLink: jest.fn(),
    };
    mockMessaging = {
      sendMessage: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DebtHandler,
        { provide: I_CONTACT_REPOSITORY, useValue: mockContactRepo },
        { provide: ContactService, useValue: mockContactService },
        { provide: PAYMENT_PROVIDER_TOKEN, useValue: mockPaymentProvider },
      ],
    }).compile();

    handler = module.get<DebtHandler>(DebtHandler);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('handleSendReminder', () => {
    it('should extract contactName from snake_case "contact_name" payload', async () => {
      const context: ActionContext = {
        senderPhoneNumber: '123456789',
        messagingService: mockMessaging,
        user: { id: 'user1', fullName: 'Test User' } as any,
        platform: MessagingPlatforms.TELEGRAM,
        organizationId: 'org1',
        messageId: 'msg1',
        messageBody: 'Relance Roland',
      };

      const data = {
        intent: DebtIntents.SEND_REMINDER,
        contact_name: 'Roland Coulibaly', // snake_case from LLM
      };

      mockContactRepo.searchByName.mockResolvedValue([]); // Mock return empty to stop further execution early, or return contact

      await handler.handle(data, context);

      // Verify that searchByName was called with the correctly extracted name
      expect(mockContactRepo.searchByName).toHaveBeenCalledWith('user1', 'Roland Coulibaly', 1);
    });

    it('should extract contactName from camelCase "contactName" payload (backward compatibility)', async () => {
      const context: ActionContext = {
        senderPhoneNumber: '123456789',
        messagingService: mockMessaging,
        user: { id: 'user1', fullName: 'Test User' } as any,
        platform: MessagingPlatforms.TELEGRAM,
        organizationId: 'org1',
        messageId: 'msg1',
        messageBody: 'Relance Roland',
      };

      const data = {
        intent: DebtIntents.SEND_REMINDER,
        contactName: 'Roland Camel',
      };

      mockContactRepo.searchByName.mockResolvedValue([]);

      await handler.handle(data, context);

      expect(mockContactRepo.searchByName).toHaveBeenCalledWith('user1', 'Roland Camel', 1);
    });
  });
});
