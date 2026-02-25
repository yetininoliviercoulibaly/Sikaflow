import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ContactService } from '../src/contact/application/services/contact.service';
import { DebtReminderJob } from '../src/contact/application/jobs/debt-reminder.job';
import { DebtHandler } from '../src/webhook/application/handlers/debt.handler';
import { I_CONTACT_REPOSITORY } from '../src/contact/domain/ports/contact.repository.interface';
import { I_TRANSACTION_REPOSITORY } from '../src/transaction/domain/ports/transaction.repository.interface';
import { I_USER_REPOSITORY } from '../src/user/domain/ports/user.repository.interface';
import { MikroORM, EntityManager } from '@mikro-orm/core';
import { I_MESSAGING_SERVICE } from '../src/common/messaging/messaging.service.interface';
import { Contact } from '../src/contact/domain/contact.entity';
import { ActionContext } from '../src/webhook/application/handlers/action-handler.interface';
import { DebtIntents } from '../src/webhook/application/constants/debt.constants';
import { MessagingPlatforms } from '../src/common/messaging/domain/constants/messaging-platforms.enum';
import { PAYMENT_PROVIDER_TOKEN } from '../src/payment/domain/ports/payment-provider.interface';

describe('Recovery Feature Flow (Relance Impayés)', () => {
  let contactService: ContactService;
  let debtReminderJob: DebtReminderJob;
  let debtHandler: DebtHandler;

  let contactRepositoryMock: any;
  let transactionRepositoryMock: any;
  let userRepositoryMock: any;
  let messagingServiceMock: any;
  let paymentProviderMock: any;

  beforeEach(async () => {
    process.env.CURRENCY = 'XOF';
    // Mocks
    contactRepositoryMock = {
      create: jest.fn(),
      update: jest.fn(),
      findWithPendingDebts: jest.fn(),
      findByPhone: jest.fn(),
      searchByName: jest.fn(),
      isShortIdUnique: jest.fn().mockResolvedValue(true),
      findByOwner: jest.fn(),
      findByShortId: jest.fn(),
    };

    transactionRepositoryMock = {
      create: jest.fn(),
    };

    userRepositoryMock = {
      findAll: jest.fn(),
    };

    messagingServiceMock = {
      sendMessage: jest.fn(),
    };

    paymentProviderMock = {
        createPaymentLink: jest.fn().mockResolvedValue('https://pay.me/link-123'),
    };

    const mockEm = Object.create(EntityManager.prototype);
    mockEm.name = 'default';
    mockEm.fork = jest.fn().mockReturnValue(mockEm);

    const mockOrm = Object.create(MikroORM.prototype);
    mockOrm.em = mockEm;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactService,
        DebtReminderJob,
        DebtHandler,
        { provide: I_CONTACT_REPOSITORY, useValue: contactRepositoryMock },
        { provide: I_TRANSACTION_REPOSITORY, useValue: transactionRepositoryMock },
        { provide: I_USER_REPOSITORY, useValue: userRepositoryMock },
        { provide: I_MESSAGING_SERVICE, useValue: messagingServiceMock },
        { provide: PAYMENT_PROVIDER_TOKEN, useValue: paymentProviderMock },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
        {
          provide: MikroORM,
          useValue: mockOrm,
        },
      ],
    }).compile();

    contactService = module.get<ContactService>(ContactService);
    debtReminderJob = module.get<DebtReminderJob>(DebtReminderJob);
    debtHandler = module.get<DebtHandler>(DebtHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Recording the Debt (L\'Ardoise)', () => {
    it('should create a contact and record a debt transaction', async () => {
      const userId = 'user-123';
      const amount = 5000;
      const contactName = 'Moussa';

      // Mock create behavior
      contactRepositoryMock.create.mockImplementation((c: Partial<Contact>) => Promise.resolve({ ...c, id: 'contact-abc' }));
      contactRepositoryMock.searchByName.mockResolvedValue([]); // Not found initially

      const result = await contactService.addDebt(userId, undefined, {
        amount,
        contactName,
        contactContext: '2 Coca',
      });

      expect(contactRepositoryMock.create).toHaveBeenCalled();
      expect(result.totalOwed).toBe(5000);
      expect(transactionRepositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
            amount: 5000,
            type: 'DEBT',
            contactId: 'contact-abc'
        })
      );
    });
  });

  describe('2. Dashboard & Reminder Job (Qui me doit ?)', () => {
    it('should identify overdue contacts and send a summary to the merchant', async () => {
        const userId = 'user-123';
        const user = { id: userId, phoneNumber: '+22507000001', fullName: 'Boutique Sika' };

        // Mock User
        userRepositoryMock.findAll.mockResolvedValue([user]);

        // Mock Contacts with Debt
        const overdueContact = new Contact(userId, 'Tanty Marie', { phone: '+22501020304' });
        overdueContact.totalOwed = 20000;
        // Set last interaction to 15 days ago (Overdue)
        overdueContact.lastInteractionAt = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);

        const recentContact = new Contact(userId, 'Moussa', { phone: '+22505060708' });
        recentContact.totalOwed = 5000;
        // Set last interaction to 2 days ago (Not overdue)
        recentContact.lastInteractionAt = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

        contactRepositoryMock.findWithPendingDebts.mockResolvedValue([overdueContact, recentContact]);

        await debtReminderJob.handleDebtReminders();

        // Expect messaging service to be called with a summary
        expect(messagingServiceMock.sendMessage).toHaveBeenCalledTimes(1);
        const callArgs = messagingServiceMock.sendMessage.mock.calls[0];
        const recipient = callArgs[0];
        const message = callArgs[1];

        expect(recipient).toBe(user.phoneNumber);
        expect(message).toContain('Rappel Créances');
        expect(message).toContain('Tanty Marie: 20 000F'); // Expect formatting

        // Logic check: The job filters for OVERDUE (>7 days).
        // Tanty Marie (15 days) -> Included.
        // Moussa (2 days) -> Excluded from the "Overdue" count (Threshold is 7 days)
        expect(message).not.toContain('Moussa');
        expect(message).toContain('Répondez "Relance [nom]"');
    });
  });

  describe('3. Manual Nudge (La Relance)', () => {
      it('should send a diplomatic message to the debtor when triggered', async () => {
          const userId = 'user-123';
          const user = { id: userId, fullName: 'Boutique Sika' };
          const context: ActionContext = {
              senderPhoneNumber: '+22507000001',
              messagingService: messagingServiceMock,
              user: user as any,
              platform: MessagingPlatforms.WHATSAPP,
              messageId: 'msg-1',
              organizationId: null,
          };

          const payload = { contactName: 'Tanty Marie' };

          // Mock finding the contact
          const contact = new Contact(userId, 'Tanty Marie', { phone: '+22501020304' });
          contact.totalOwed = 20000;
          contactRepositoryMock.searchByName.mockResolvedValue([contact]);

          await debtHandler.handle({ intent: DebtIntents.SEND_REMINDER, ...payload }, context);

          // Expect 2 messages:
          // 1. To the Debtor (The Nudge)
          // 2. To the Merchant (Confirmation)
          expect(messagingServiceMock.sendMessage).toHaveBeenCalledTimes(2);

          // Check Message to Debtor
          const debtorCall = messagingServiceMock.sendMessage.mock.calls.find((call: [string, ...unknown[]]) => call[0] === contact.phone);
          expect(debtorCall).toBeDefined();
          const debtorMessage = debtorCall[1];

          expect(debtorMessage).toContain('Bonjour Tanty Marie');
          expect(debtorMessage).toContain('Boutique Sika'); // User context
          expect(debtorMessage).toContain('20 000 FCFA');
          
          // Check for Smart Payment Link
          expect(paymentProviderMock.createPaymentLink).toHaveBeenCalledWith(
            20000, 
            'XOF', 
            expect.objectContaining({ contactId: contact.id })
          );
          expect(debtorMessage).toContain('https://pay.me/link-123');
      });
  });
});
