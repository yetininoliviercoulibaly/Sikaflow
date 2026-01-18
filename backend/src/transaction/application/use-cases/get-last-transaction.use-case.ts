import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ITransactionRepository, I_TRANSACTION_REPOSITORY } from '../../domain/ports/transaction.repository.interface';
import { ResolveContextUseCase } from '../../../organization/application/use-cases/resolve-context.use-case';
import { IUserRepository, I_USER_REPOSITORY } from '../../../user/domain/ports/user.repository.interface';
import { Transaction } from '../../domain/transaction.entity';

export interface GetLastTransactionCommand {
  phoneNumber: string;
}

@Injectable()
export class GetLastTransactionUseCase {
  constructor(
    @Inject(I_TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
    private readonly resolveContextUseCase: ResolveContextUseCase,
    @Inject(I_USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(command: GetLastTransactionCommand): Promise<Transaction | null> {
    const { phoneNumber } = command;

    // 1. Resolve Context (Organization)
    const organization = await this.resolveContextUseCase.execute({ phoneNumber });

    // 2. Resolve User
    const user = await this.userRepository.findByPhoneNumber(phoneNumber);
    if (!user) {
        throw new NotFoundException(`User with phone ${phoneNumber} not found`);
    }

    // 3. Find Latest
    return this.transactionRepository.findLatestByUser(user.id, organization.id);
  }
}
