import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetTransactionsListUseCase } from './get-transactions-list.use-case';
import { I_TRANSACTION_REPOSITORY } from '../../domain/ports/transaction.repository.interface';
import { I_USER_REPOSITORY } from '../../../user/domain/ports/user.repository.interface';
import { ResolveContextUseCase } from '../../../organization/application/use-cases/resolve-context.use-case';
import { Transaction, TransactionType, TransactionStatus } from '../../domain/transaction.entity';

const makeTx = (id: string): Transaction =>
  new Transaction(
    id, 'org-1', 'user-1', null,
    TransactionType.EXPENSE, 5000, 'XOF', 'Boissons', 'boissons',
    new Date('2026-02-24'), new Date('2026-02-24'), TransactionStatus.COMPLETED,
  );

describe('GetTransactionsListUseCase', () => {
  let useCase: GetTransactionsListUseCase;
  let transactionRepository: { findByOrganization: jest.Mock };
  let userRepository: { findByPhoneNumber: jest.Mock; findByIdentifier: jest.Mock };
  let resolveContextUseCase: { execute: jest.Mock };

  beforeEach(async () => {
    transactionRepository = { findByOrganization: jest.fn() };
    userRepository = { findByPhoneNumber: jest.fn(), findByIdentifier: jest.fn() };
    resolveContextUseCase = { execute: jest.fn() };

    userRepository.findByIdentifier.mockResolvedValue({ id: 'user-1', phoneNumber: '+22507000000' });
    resolveContextUseCase.execute.mockResolvedValue({ id: 'org-1', name: 'Maquis Chez Omar' });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetTransactionsListUseCase,
        { provide: I_TRANSACTION_REPOSITORY, useValue: transactionRepository },
        { provide: I_USER_REPOSITORY, useValue: userRepository },
        { provide: ResolveContextUseCase, useValue: resolveContextUseCase },
      ],
    }).compile();

    useCase = module.get<GetTransactionsListUseCase>(GetTransactionsListUseCase);
  });

  it('should return transactions list with given limit', async () => {
    const txs = Array.from({ length: 5 }, (_, i) => makeTx(`tx-${i}`));
    transactionRepository.findByOrganization.mockResolvedValue(txs);

    const result = await useCase.execute({ phoneNumber: '+22507000000', limit: 5 });

    expect(transactionRepository.findByOrganization).toHaveBeenCalledWith('org-1', { limit: 5 });
    expect(result).toHaveLength(5);
  });

  it('should use limit=10 by default when not provided', async () => {
    transactionRepository.findByOrganization.mockResolvedValue([]);

    await useCase.execute({ phoneNumber: '+22507000000' });

    expect(transactionRepository.findByOrganization).toHaveBeenCalledWith('org-1', { limit: 10 });
  });

  it('should return empty array when no transactions', async () => {
    transactionRepository.findByOrganization.mockResolvedValue([]);

    const result = await useCase.execute({ phoneNumber: '+22507000000' });

    expect(result).toEqual([]);
  });

  it('should throw NotFoundException when user not found', async () => {
    userRepository.findByIdentifier.mockResolvedValue(null);

    await expect(useCase.execute({ phoneNumber: '+22500000000' })).rejects.toThrow(NotFoundException);
  });
});
