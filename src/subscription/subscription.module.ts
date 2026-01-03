import { Module, forwardRef } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { EventPassSchema } from './infrastructure/persistence/event-pass.schema';
import { MikroOrmEventPassRepository } from './infrastructure/persistence/mikro-orm-event-pass.repository';
import { I_EVENT_PASS_REPOSITORY } from './domain/ports/event-pass.repository.interface';
import { SubscriptionSchema } from './infrastructure/persistence/subscription.schema';
import { I_SUBSCRIPTION_REPOSITORY } from './domain/ports/subscription.repository.interface';
import { MikroOrmSubscriptionRepository } from './infrastructure/persistence/mikro-orm-subscription.repository';
import { ActivateEventPassUseCase } from './application/use-cases/activate-event-pass.use-case';
import { CheckSubscriptionUseCase } from './application/use-cases/check-subscription.use-case';
import { PaymentModule } from '../payment/payment.module';
import { OrganizationModule } from '../organization/organization.module';

@Module({
  imports: [
    MikroOrmModule.forFeature([EventPassSchema, SubscriptionSchema]),
    forwardRef(() => PaymentModule),
    OrganizationModule,
  ],
  providers: [
    {
      provide: I_EVENT_PASS_REPOSITORY,
      useClass: MikroOrmEventPassRepository,
    },
    {
      provide: I_SUBSCRIPTION_REPOSITORY,
      useClass: MikroOrmSubscriptionRepository,
    },
    ActivateEventPassUseCase,
    CheckSubscriptionUseCase,
  ],
  exports: [
    I_EVENT_PASS_REPOSITORY,
    I_SUBSCRIPTION_REPOSITORY,
    ActivateEventPassUseCase,
    CheckSubscriptionUseCase,
  ],
})
export class SubscriptionModule {}
