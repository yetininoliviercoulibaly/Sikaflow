import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
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
import { TicketingModule } from './ticketing/ticketing.module';
import { PaymentModule } from './payment/payment.module';
import { FeedbackModule } from './feedback/feedback.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { RawBodyMiddleware } from './common/middleware/raw-body.middleware';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
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
    TicketingModule,
    PaymentModule,
    FeedbackModule,
    OnboardingModule,
    EventEmitterModule.forRoot(),
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(RawBodyMiddleware)
            .forRoutes({ path: 'webhook', method: RequestMethod.POST });
    }
}
