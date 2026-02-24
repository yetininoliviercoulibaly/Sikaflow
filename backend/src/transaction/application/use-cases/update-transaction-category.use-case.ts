import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ITransactionRepository, I_TRANSACTION_REPOSITORY } from '../../domain/ports/transaction.repository.interface';
import { Transaction } from '../../domain/transaction.entity';

export interface UpdateTransactionCategoryCommand {
  transactionId: string;
  category: string;
}

@Injectable()
export class UpdateTransactionCategoryUseCase {
  constructor(
    @Inject(I_TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
  ) {}

  async execute(command: UpdateTransactionCategoryCommand): Promise<Transaction> {
    const { transactionId, category } = command;

    const transaction = await this.transactionRepository.findById(transactionId);
    if (!transaction) {
      throw new NotFoundException(`Transaction ${transactionId} not found`);
    }

    transaction.category = category;
    return this.transactionRepository.update(transaction);
  }
}
