import { Test, TestingModule } from '@nestjs/testing';
import { ContactService } from './contact.service';
import { I_CONTACT_REPOSITORY, IContactRepository } from '../../domain/ports/contact.repository.interface';
import { I_TRANSACTION_REPOSITORY, ITransactionRepository } from '../../../transaction/domain/ports/transaction.repository.interface';
import { Contact } from '../../domain/contact.entity';
import { Transaction, TransactionType, TransactionStatus } from '../../../transaction/domain/transaction.entity';

const mockContactRepository = () => ({
  create: jest.fn(),
  update: jest.fn(),
  findByPhone: jest.fn(),
  searchByName: jest.fn(),
  findByShortId: jest.fn(),
  isShortIdUnique: jest.fn(),
});

const mockTransactionRepository = () => ({
  create: jest.fn(),
});

describe('ContactService', () => {
  let service: ContactService;
  let contactRepo: jest.Mocked<IContactRepository>;
  let transactionRepo: jest.Mocked<ITransactionRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactService,
        { provide: I_CONTACT_REPOSITORY, useFactory: mockContactRepository },
        { provide: I_TRANSACTION_REPOSITORY, useFactory: mockTransactionRepository },
      ],
    }).compile();

    service = module.get<ContactService>(ContactService);
    contactRepo = module.get(I_CONTACT_REPOSITORY);
    transactionRepo = module.get(I_TRANSACTION_REPOSITORY);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addDebt', () => {
    it('should create a NEW contact and add debt', async () => {
      contactRepo.searchByName.mockResolvedValue([]);
      contactRepo.findByPhone.mockResolvedValue(null);
      contactRepo.isShortIdUnique.mockResolvedValue(true);
      contactRepo.create.mockImplementation(async (c) => c);

      const result = await service.addDebt('user1', 'org1', {
        amount: 5000,
        contactName: 'Moussa',
        contactPhone: '0707',
      });

      expect(contactRepo.create).toHaveBeenCalled();
      expect(contactRepo.update).toHaveBeenCalled();
      expect(result.totalOwed).toBe(5000);
      expect(transactionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
            type: TransactionType.DEBT,
            amount: 5000,
        })
      );
    });

    it('should update EXISTING contact debt', async () => {
        const existingContact = new Contact('user1', 'Moussa', { phone: '0707' });
        existingContact.totalOwed = 2000;
        contactRepo.findByPhone.mockResolvedValue(existingContact);
  
        const result = await service.addDebt('user1', 'org1', {
          amount: 3000,
          contactName: 'Moussa',
          contactPhone: '0707',
        });
  
        expect(contactRepo.create).not.toHaveBeenCalled();
        expect(contactRepo.update).toHaveBeenCalled();
        expect(result.totalOwed).toBe(5000); // 2000 + 3000
    });
  });

  describe('settleDebt', () => {
    it('should settle debt and cap at total owed amount', async () => {
       const existingContact = new Contact('user1', 'Moussa');
       existingContact.totalOwed = 5000;
       contactRepo.findByShortId.mockResolvedValue(existingContact);

       const result = await service.settleDebt('user1', 'org1', {
        contactShortId: 'ABC1234',
        amount: 6000, // Overpayment
       });

       expect(contactRepo.update).toHaveBeenCalled();
       expect(result?.remaining).toBe(0);
       expect(result?.settledAmount).toBe(5000); // Capped
       expect(transactionRepo.create).toHaveBeenCalledWith(
           expect.objectContaining({
               type: TransactionType.INCOME,
               amount: 5000,
               status: TransactionStatus.COMPLETED
           })
       );
    });

    it('should return null if contact not found', async () => {
        contactRepo.findByShortId.mockResolvedValue(null);
        contactRepo.searchByName.mockResolvedValue([]);

        const result = await service.settleDebt('user1', 'org1', {
            contactShortId: 'UNKNOWN',
        });

        expect(result).toBeNull();
    });
  });

  describe('ShortId Generation', () => {
      it('should retry if shortId collision occurs', async () => {
          contactRepo.searchByName.mockResolvedValue([]);
          contactRepo.findByPhone.mockResolvedValue(null);
          contactRepo.create.mockImplementation(async (c) => c);

          // Force collision twice then success
          contactRepo.isShortIdUnique
            .mockResolvedValueOnce(false)
            .mockResolvedValueOnce(false)
            .mockResolvedValueOnce(true);

          await service.addDebt('user1', 'org1', {
              amount: 100,
              contactName: 'Test',
          });

          // Called 3 times (2 failures + 1 success)
          expect(contactRepo.isShortIdUnique).toHaveBeenCalledTimes(3);
      });
  });
});
