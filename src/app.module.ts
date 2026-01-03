import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import config from './mikro-orm.config';
import { OrganizationModule } from './organization/organization.module';
import { UserModule } from './user/user.module';
import { TransactionModule } from './transaction/transaction.module';
import { IncidentModule } from './incident/incident.module';
import { WebhookModule } from './webhook/webhook.module';
import { PromptModule } from './common/prompt/prompt.module';
import { BullModule } from '@nestjs/bullmq';
import { ReportModule } from './report/report.module';
import { SubscriptionModule } from './subscription/subscription.module';

@Module({
  imports: [
    MikroOrmModule.forRoot(config),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
    OrganizationModule,
    UserModule,
    TransactionModule,
    IncidentModule,
    WebhookModule,
    PromptModule,
    ReportModule,
    SubscriptionModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
