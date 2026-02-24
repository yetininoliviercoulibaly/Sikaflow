import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ITransactionRepository, I_TRANSACTION_REPOSITORY } from '../../domain/ports/transaction.repository.interface';
import { ResolveContextUseCase } from '../../../organization/application/use-cases/resolve-context.use-case';
import { IUserRepository, I_USER_REPOSITORY } from '../../../user/domain/ports/user.repository.interface';
import { Transaction } from '../../domain/transaction.entity';

export interface GetTransactionsListCommand {
  phoneNumber: string;
  limit?: number;
}

@Injectable()
export class GetTransactionsListUseCase {
  constructor(
    @Inject(I_TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
    private readonly resolveContextUseCase: ResolveContextUseCase,
    @Inject(I_USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(command: GetTransactionsListCommand): Promise<Transaction[]> {
    const { phoneNumber, limit = 10 } = command;

    const user = await this.userRepository.findByPhoneNumber(phoneNumber);
    if (!user) {
      throw new NotFoundException(`User with phone ${phoneNumber} not found`);
    }

    const organization = await this.resolveContextUseCase.execute({ phoneNumber });

    return this.transactionRepository.findByOrganization(organization.id, { limit });
  }
}
