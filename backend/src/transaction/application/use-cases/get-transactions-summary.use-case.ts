import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ITransactionRepository, I_TRANSACTION_REPOSITORY } from '../../domain/ports/transaction.repository.interface';
import { ResolveContextUseCase } from '../../../organization/application/use-cases/resolve-context.use-case';
import { IUserRepository, I_USER_REPOSITORY } from '../../../user/domain/ports/user.repository.interface';
import { TransactionType } from '../../domain/transaction.entity';

export interface GetTransactionsSummaryCommand {
  phoneNumber: string;
  startDate?: Date;
  endDate?: Date;
}

export interface RecentTransaction {
  id: string;
  type: string;
  amount: number;
  category: string | null;
  description: string | null;
  transactionDate: Date;
}

export interface TransactionsSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  recentTransactions: RecentTransaction[];
}

@Injectable()
export class GetTransactionsSummaryUseCase {
  constructor(
    @Inject(I_TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
    private readonly resolveContextUseCase: ResolveContextUseCase,
    @Inject(I_USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(command: GetTransactionsSummaryCommand): Promise<TransactionsSummary> {
    const { phoneNumber, startDate, endDate } = command;

    const user = await this.userRepository.findByPhoneNumber(phoneNumber);
    if (!user) {
      throw new NotFoundException(`User with phone ${phoneNumber} not found`);
    }

    const organization = await this.resolveContextUseCase.execute({ phoneNumber });

    const transactions = await this.transactionRepository.findByOrganization(organization.id, {
      limit: 50,
      startDate,
      endDate,
    });

    const income = transactions.filter(t => t.type === TransactionType.INCOME);
    const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE);

    const totalIncome = income.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExpenses = expenses.reduce((sum, t) => sum + Number(t.amount), 0);
    const balance = totalIncome - totalExpenses;

    const cashTransactions = transactions.filter(
      t => t.type === TransactionType.INCOME || t.type === TransactionType.EXPENSE,
    );

    const recentTransactions: RecentTransaction[] = cashTransactions.slice(0, 5).map(t => ({
      id: t.id,
      type: t.type,
      amount: Number(t.amount),
      category: t.category,
      description: t.description,
      transactionDate: t.transactionDate,
    }));

    return { totalIncome, totalExpenses, balance, recentTransactions };
  }
}
