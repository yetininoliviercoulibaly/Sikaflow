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

@Module({
  imports: [
    MikroOrmModule.forFeature([ContactSchema]),
    UserModule,
    MessagingModule,
    TransactionModule,
  ],
  providers: [
    {
      provide: I_CONTACT_REPOSITORY,
      useClass: MikroOrmContactRepository,
    },
    MikroOrmContactRepository,
    DebtReminderJob,
    ContactService,
  ],
  exports: [I_CONTACT_REPOSITORY, MikroOrmContactRepository, ContactService],
})
export class ContactModule {}

