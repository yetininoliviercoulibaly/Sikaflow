import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { TransactionSchema } from './infrastructure/persistence/transaction.schema';
import { MikroOrmTransactionRepository } from './infrastructure/persistence/mikro-orm-transaction.repository';
import { I_TRANSACTION_REPOSITORY } from './domain/ports/transaction.repository.interface';
import { TransactionController } from './application/controllers/transaction.controller';
import { CreateTransactionUseCase } from './application/use-cases/create-transaction.use-case';
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
    {
      provide: I_TRANSACTION_REPOSITORY,
      useClass: MikroOrmTransactionRepository,
    },
    CreateTransactionUseCase,
  ],
  exports: [I_TRANSACTION_REPOSITORY, CreateTransactionUseCase],
})
export class TransactionModule {}
