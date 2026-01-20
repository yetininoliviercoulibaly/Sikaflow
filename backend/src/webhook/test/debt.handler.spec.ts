import { Test, TestingModule } from '@nestjs/testing';
import { DebtHandler } from '../application/handlers/debt.handler';
import { I_CONTACT_REPOSITORY } from '../../contact/domain/ports/contact.repository.interface';
import { I_TRANSACTION_REPOSITORY } from '../../transaction/domain/ports/transaction.repository.interface';
import { Contact } from '../../contact/domain/contact.entity';
import { Transaction, TransactionType } from '../../transaction/domain/transaction.entity';

describe('DebtHandler', () => {
  let handler: DebtHandler;
  let contactRepository: any;
  let transactionRepository: any;
  let messagingService: any;

  const mockUser = { id: 'user-123', phoneNumber: '123456789' };
  const mockContext = {
    senderPhoneNumber: '123456789',
    user: mockUser,
    organizationId: 'org-123',
    messagingService: {
      sendMessage: jest.fn(),
    },
  };

  beforeEach(async () => {
    contactRepository = {
      findByPhone: jest.fn(),
      searchByName: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateBalances: jest.fn(),
      isShortIdUnique: jest.fn().mockResolvedValue(true),
      findWithPendingDebts: jest.fn(),
      findByOwner: jest.fn(),
      findByShortId: jest.fn(),
    };

    transactionRepository = {
      create: jest.fn(),
    };

    messagingService = mockContext.messagingService;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DebtHandler,
        {
          provide: I_CONTACT_REPOSITORY,
          useValue: contactRepository,
        },
        {
          provide: I_TRANSACTION_REPOSITORY,
          useValue: transactionRepository,
        },
      ],
    }).compile();

    handler = module.get<DebtHandler>(DebtHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleAddDebt', () => {
    it('should send error if amount or contactName is missing', async () => {
      await handler.handle(
        { intent: 'ADD_DEBT', amount: '5000' }, // missing contactName
        mockContext as any,
      );
      expect(messagingService.sendMessage).toHaveBeenCalledWith(
        mockContext.senderPhoneNumber,
        expect.stringContaining('Veuillez préciser le montant et le nom'),
      );
    });

    it('should create new contact and transaction if not exists', async () => {
      contactRepository.findByPhone.mockResolvedValue(null);
      contactRepository.searchByName.mockResolvedValue([]);
      // Mock updateBalances to return the contact
      const mockCreatedContact = new Contact(mockUser.id, 'Moussa');
      mockCreatedContact.id = 'contact-id';
      mockCreatedContact.totalOwed = 5000;
      contactRepository.updateBalances.mockResolvedValue(mockCreatedContact);

      await handler.handle(
        {
          intent: 'ADD_DEBT',
          amount: '5000',
          contactName: 'Moussa',
          currency: 'XOF'
        },
        mockContext as any,
      );

      expect(contactRepository.create).toHaveBeenCalled();
      expect(transactionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: TransactionType.DEBT,
          amount: 5000,
          status: 'PENDING',
        })
      );
      expect(messagingService.sendMessage).toHaveBeenCalledWith(
        mockContext.senderPhoneNumber,
        expect.stringContaining('Créance enregistrée'),
      );
    });

    it('should fail with invalid amount', async () => {
       contactRepository.findByPhone.mockResolvedValue(null);
       contactRepository.searchByName.mockResolvedValue([]);

       await handler.handle(
        {
          intent: 'ADD_DEBT',
          amount: '-500',
          contactName: 'Moussa',
        },
        mockContext as any,
      );
       expect(messagingService.sendMessage).toHaveBeenCalledWith(
        mockContext.senderPhoneNumber,
        expect.stringContaining('Montant invalide'),
      );
      expect(transactionRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('handleSettleDebt', () => {
      it('should settle debt and create income transaction', async () => {
          const mockContact = new Contact(mockUser.id, 'Moussa');
          mockContact.totalOwed = 5000;
          contactRepository.searchByName.mockResolvedValue([mockContact]);

          // Mock updateBalances to return contact with 0 owed
          const mockUpdatedContact = new Contact(mockUser.id, 'Moussa');
          mockUpdatedContact.totalOwed = 0;
          contactRepository.updateBalances.mockResolvedValue(mockUpdatedContact);

          await handler.handle(
              {
                  intent: 'SETTLE_DEBT',
                  contactName: 'Moussa',
                  amount: '5000'
              },
              mockContext as any
          );

          expect(contactRepository.updateBalances).toHaveBeenCalledWith(
              mockContact.id, -5000, 0
          );
          expect(transactionRepository.create).toHaveBeenCalledWith(
              expect.objectContaining({
                  type: TransactionType.INCOME,
                  amount: 5000
              })
          );
          expect(messagingService.sendMessage).toHaveBeenCalledWith(
              mockContext.senderPhoneNumber,
              expect.stringContaining('Paiement enregistré')
          );
      });
  });
});
