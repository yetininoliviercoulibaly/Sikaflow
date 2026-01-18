import { Inject, Injectable } from '@nestjs/common';
import { ITransactionRepository, I_TRANSACTION_REPOSITORY } from '../../domain/ports/transaction.repository.interface';

export interface DeleteTransactionCommand {
  transactionId: string;
}

@Injectable()
export class DeleteTransactionUseCase {
  constructor(
    @Inject(I_TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
  ) {}

  async execute(command: DeleteTransactionCommand): Promise<void> {
    const { transactionId } = command;
    await this.transactionRepository.delete(transactionId);
  }
}
