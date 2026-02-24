import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { TransactionSchema } from './infrastructure/persistence/transaction.schema';
import { MikroOrmTransactionRepository } from './infrastructure/persistence/mikro-orm-transaction.repository';
import { I_TRANSACTION_REPOSITORY } from './domain/ports/transaction.repository.interface';
import { CreateTransactionUseCase } from './application/use-cases/create-transaction.use-case';
import { GetLastTransactionUseCase } from './application/use-cases/get-last-transaction.use-case';
import { DeleteTransactionUseCase } from './application/use-cases/delete-transaction.use-case';
import { GetTransactionsSummaryUseCase } from './application/use-cases/get-transactions-summary.use-case';
import { TransactionController } from './application/controllers/transaction.controller';
import { OrganizationModule } from '../organization/organization.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    MikroOrmModule.forFeature([TransactionSchema]),
    OrganizationModule,
    UserModule,
  ],
  controllers: [TransactionController],
  providers: [
    CreateTransactionUseCase,
    GetLastTransactionUseCase,
    DeleteTransactionUseCase,
    GetTransactionsSummaryUseCase,
    MikroOrmTransactionRepository,
    {
      provide: I_TRANSACTION_REPOSITORY,
      useExisting: MikroOrmTransactionRepository,
    },
  ],
  exports: [I_TRANSACTION_REPOSITORY, CreateTransactionUseCase, GetLastTransactionUseCase, DeleteTransactionUseCase, GetTransactionsSummaryUseCase],
})
export class TransactionModule {}
