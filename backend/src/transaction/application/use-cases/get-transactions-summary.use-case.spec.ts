import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetTransactionsSummaryUseCase } from './get-transactions-summary.use-case';
import { I_TRANSACTION_REPOSITORY } from '../../domain/ports/transaction.repository.interface';
import { I_USER_REPOSITORY } from '../../../user/domain/ports/user.repository.interface';
import { ResolveContextUseCase } from '../../../organization/application/use-cases/resolve-context.use-case';
import { Transaction, TransactionType, TransactionStatus } from '../../domain/transaction.entity';

const makeTransaction = (type: TransactionType, amount: number, category: string, description: string): Transaction =>
  new Transaction(
    `tx-${Math.random()}`,
    'org-1',
    'user-1',
    null,
    type,
    amount,
    'XOF',
    category,
    description,
    new Date('2026-02-24'),
    new Date('2026-02-24'),
    TransactionStatus.COMPLETED,
  );

describe('GetTransactionsSummaryUseCase', () => {
  let useCase: GetTransactionsSummaryUseCase;
  let transactionRepository: { findByOrganization: jest.Mock };
  let userRepository: { findByPhoneNumber: jest.Mock };
  let resolveContextUseCase: { execute: jest.Mock };

  beforeEach(async () => {
    transactionRepository = { findByOrganization: jest.fn() };
    userRepository = { findByPhoneNumber: jest.fn() };
    resolveContextUseCase = { execute: jest.fn() };

    userRepository.findByPhoneNumber.mockResolvedValue({ id: 'user-1', phoneNumber: '+22507000000' });
    resolveContextUseCase.execute.mockResolvedValue({ id: 'org-1', name: 'Maquis Chez Omar' });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetTransactionsSummaryUseCase,
        { provide: I_TRANSACTION_REPOSITORY, useValue: transactionRepository },
        { provide: I_USER_REPOSITORY, useValue: userRepository },
        { provide: ResolveContextUseCase, useValue: resolveContextUseCase },
      ],
    }).compile();

    useCase = module.get<GetTransactionsSummaryUseCase>(GetTransactionsSummaryUseCase);
  });

  it('should compute correct totals from INCOME and EXPENSE transactions', async () => {
    transactionRepository.findByOrganization.mockResolvedValue([
      makeTransaction(TransactionType.INCOME, 25000, 'Ventes', 'vente de billets'),
      makeTransaction(TransactionType.INCOME, 50000, 'Services', 'prestation soirée'),
      makeTransaction(TransactionType.EXPENSE, 5000, 'Boissons', 'boissons'),
      makeTransaction(TransactionType.EXPENSE, 2000, 'Transport', 'transport'),
    ]);

    const result = await useCase.execute({ phoneNumber: '+22507000000' });

    expect(result.totalIncome).toBe(75000);
    expect(result.totalExpenses).toBe(7000);
    expect(result.balance).toBe(68000);
    expect(result.recentTransactions).toHaveLength(4);
  });

  it('should return zero totals when no transactions', async () => {
    transactionRepository.findByOrganization.mockResolvedValue([]);

    const result = await useCase.execute({ phoneNumber: '+22507000000' });

    expect(result.totalIncome).toBe(0);
    expect(result.totalExpenses).toBe(0);
    expect(result.balance).toBe(0);
    expect(result.recentTransactions).toHaveLength(0);
  });

  it('should exclude DEBT and CREDIT from totals', async () => {
    transactionRepository.findByOrganization.mockResolvedValue([
      makeTransaction(TransactionType.INCOME, 10000, 'Ventes', 'vente'),
      makeTransaction(TransactionType.DEBT, 5000, 'Général', 'dette Omar'),
      makeTransaction(TransactionType.CREDIT, 3000, 'Général', 'crédit Fatou'),
    ]);

    const result = await useCase.execute({ phoneNumber: '+22507000000' });

    expect(result.totalIncome).toBe(10000);
    expect(result.totalExpenses).toBe(0);
    expect(result.balance).toBe(10000);
    expect(result.recentTransactions).toHaveLength(1);
  });

  it('should limit recentTransactions to 5 entries', async () => {
    const many = Array.from({ length: 10 }, (_, i) =>
      makeTransaction(TransactionType.INCOME, 1000, 'Ventes', `vente ${i}`),
    );
    transactionRepository.findByOrganization.mockResolvedValue(many);

    const result = await useCase.execute({ phoneNumber: '+22507000000' });

    expect(result.recentTransactions).toHaveLength(5);
  });

  it('should throw NotFoundException when user is not found', async () => {
    userRepository.findByPhoneNumber.mockResolvedValue(null);

    await expect(useCase.execute({ phoneNumber: '+22500000000' })).rejects.toThrow(NotFoundException);
  });

  it('should pass startDate and endDate to the repository', async () => {
    const startDate = new Date('2026-02-23T00:00:00Z');
    const endDate = new Date('2026-02-23T23:59:59Z');
    transactionRepository.findByOrganization.mockResolvedValue([
      makeTransaction(TransactionType.INCOME, 25000, 'Ventes', 'vente de billets'),
    ]);

    await useCase.execute({ phoneNumber: '+22507000000', startDate, endDate });

    expect(transactionRepository.findByOrganization).toHaveBeenCalledWith('org-1', {
      limit: 50,
      startDate,
      endDate,
    });
  });

  it('should pass no dates when not provided', async () => {
    transactionRepository.findByOrganization.mockResolvedValue([]);

    await useCase.execute({ phoneNumber: '+22507000000' });

    expect(transactionRepository.findByOrganization).toHaveBeenCalledWith('org-1', {
      limit: 50,
      startDate: undefined,
      endDate: undefined,
    });
  });
});
