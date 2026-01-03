import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ITransactionRepository, I_TRANSACTION_REPOSITORY } from '../../domain/ports/transaction.repository.interface';
import { ResolveContextUseCase } from '../../../organization/application/use-cases/resolve-context.use-case';
import { IUserRepository, I_USER_REPOSITORY } from '../../../user/domain/ports/user.repository.interface';
import { Transaction, TransactionType } from '../../domain/transaction.entity';
import { v4 as uuidv4 } from 'uuid';

export interface CreateTransactionCommand {
  phoneNumber: string;
  amount: number;
  category: string;
  description?: string;
  type: TransactionType;
  originMessageId?: string;
}

@Injectable()
export class CreateTransactionUseCase {
  constructor(
    @Inject(I_TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
    private readonly resolveContextUseCase: ResolveContextUseCase,
    @Inject(I_USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(command: CreateTransactionCommand): Promise<Transaction> {
    const { phoneNumber, amount, category, description, type, originMessageId } = command;

    // 1. Resolve Context (Organization)
    const organization = await this.resolveContextUseCase.execute({ phoneNumber });

    // 2. Resolve User (for reportedByUserId)
    const user = await this.userRepository.findByPhoneNumber(phoneNumber);
    if (!user) {
        throw new NotFoundException(`User with phone ${phoneNumber} not found`);
    }

    // 3. Create Transaction
    const transaction = new Transaction(
      uuidv4(),
      organization.id,
      user.id, // reportedByUserId
      originMessageId || null, // originMessageId
      type,
      amount,
      'EUR', // currency
      category,
      description || null,
      new Date(), // transactionDate
      new Date(), // createdAt
    );

    // 4. Persist
    return this.transactionRepository.create(transaction);
  }
}
