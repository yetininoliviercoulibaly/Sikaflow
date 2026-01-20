import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ContactOrmEntity } from './infrastructure/persistence/contact.orm-entity';
import { MikroOrmContactRepository } from './infrastructure/persistence/mikro-orm-contact.repository';
import { I_CONTACT_REPOSITORY } from './domain/ports/contact.repository.interface';
import { DebtReminderJob } from './application/jobs/debt-reminder.job';
import { UserModule } from '../user/user.module';
import { MessagingModule } from '../common/messaging/messaging.module';

@Module({
  imports: [
    MikroOrmModule.forFeature([ContactOrmEntity]),
    UserModule,
    MessagingModule,
  ],
  providers: [
    {
      provide: I_CONTACT_REPOSITORY,
      useClass: MikroOrmContactRepository,
    },
    MikroOrmContactRepository,
    DebtReminderJob,
  ],
  exports: [I_CONTACT_REPOSITORY, MikroOrmContactRepository],
})
export class ContactModule {}

