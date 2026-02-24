import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ContactSchema } from './infrastructure/persistence/contact.schema';
import { MikroOrmContactRepository } from './infrastructure/persistence/mikro-orm-contact.repository';
import { I_CONTACT_REPOSITORY } from './domain/ports/contact.repository.interface';
import { DebtReminderJob } from './application/jobs/debt-reminder.job';
import { UserModule } from '../user/user.module';
import { MessagingModule } from '../common/messaging/messaging.module';
import { ContactService } from './application/services/contact.service';
import { TransactionModule } from '../transaction/transaction.module';
import { AddDebtUseCase } from './application/use-cases/add-debt.use-case';
import { DebtController } from './application/controllers/debt.controller';
import { OrganizationModule } from '../organization/organization.module';

@Module({
  imports: [
    MikroOrmModule.forFeature([ContactSchema]),
    UserModule,
    MessagingModule,
    TransactionModule,
    OrganizationModule,
  ],
  controllers: [DebtController],
  providers: [
    {
      provide: I_CONTACT_REPOSITORY,
      useClass: MikroOrmContactRepository,
    },
    MikroOrmContactRepository,
    DebtReminderJob,
    ContactService,
    AddDebtUseCase,
  ],
  exports: [I_CONTACT_REPOSITORY, MikroOrmContactRepository, ContactService, AddDebtUseCase],
})
export class ContactModule {}

