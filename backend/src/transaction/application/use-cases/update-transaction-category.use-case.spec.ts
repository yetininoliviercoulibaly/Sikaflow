import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UpdateTransactionCategoryUseCase } from './update-transaction-category.use-case';
import { I_TRANSACTION_REPOSITORY } from '../../domain/ports/transaction.repository.interface';
import { Transaction, TransactionType, TransactionStatus } from '../../domain/transaction.entity';

const makeTransaction = (id: string, category: string): Transaction =>
  new Transaction(
    id,
    'org-1',
    'user-1',
    null,
    TransactionType.EXPENSE,
    15000,
    'XOF',
    category,
    'DJ',
    new Date('2026-02-24'),
    new Date('2026-02-24'),
    TransactionStatus.COMPLETED,
  );

describe('UpdateTransactionCategoryUseCase', () => {
  let useCase: UpdateTransactionCategoryUseCase;
  let transactionRepository: { findById: jest.Mock; update: jest.Mock };

  beforeEach(async () => {
    transactionRepository = {
      findById: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateTransactionCategoryUseCase,
        { provide: I_TRANSACTION_REPOSITORY, useValue: transactionRepository },
      ],
    }).compile();

    useCase = module.get<UpdateTransactionCategoryUseCase>(UpdateTransactionCategoryUseCase);
  });

  it('should update the transaction category', async () => {
    const tx = makeTransaction('tx-1', 'Staff');
    const updated = makeTransaction('tx-1', 'Charges');
    transactionRepository.findById.mockResolvedValue(tx);
    transactionRepository.update.mockResolvedValue(updated);

    const result = await useCase.execute({ transactionId: 'tx-1', category: 'Charges' });

    expect(transactionRepository.findById).toHaveBeenCalledWith('tx-1');
    expect(transactionRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'tx-1', category: 'Charges' }),
    );
    expect(result.category).toBe('Charges');
  });

  it('should throw NotFoundException when transaction does not exist', async () => {
    transactionRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ transactionId: 'unknown-id', category: 'Nourriture' }),
    ).rejects.toThrow(NotFoundException);

    expect(transactionRepository.update).not.toHaveBeenCalled();
  });

  it('should correctly mutate the category before calling update', async () => {
    const tx = makeTransaction('tx-2', 'Général');
    transactionRepository.findById.mockResolvedValue(tx);
    transactionRepository.update.mockImplementation(async (t) => t);

    await useCase.execute({ transactionId: 'tx-2', category: 'Boissons' });

    expect(tx.category).toBe('Boissons');
  });
});
