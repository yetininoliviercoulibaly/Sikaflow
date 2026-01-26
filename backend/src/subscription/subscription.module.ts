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
import { SubscribeMonthlyUseCase } from './application/use-cases/subscribe-monthly.use-case';
import { SubscribeUseCase } from './application/use-cases/subscribe.use-case';
import { CheckFeatureUseCase } from './application/use-cases/check-feature.use-case';
import { GetOrganizationFeaturesUseCase } from './application/use-cases/get-organization-features.use-case';
import { PaymentModule } from '../payment/payment.module';
import { OrganizationModule } from '../organization/organization.module';
import { FeatureGuard } from '../common/guards/feature.guard';

import { PaymentMethodSchema } from '../payment/infrastructure/persistence/payment-method.schema';
import { SubscriptionPlanSchema } from './infrastructure/persistence/subscription-plan.schema';
import { I_SUBSCRIPTION_PLAN_REPOSITORY } from './domain/ports/subscription-plan.repository.interface';
import { MikroOrmSubscriptionPlanRepository } from './infrastructure/persistence/mikro-orm-subscription-plan.repository';

@Module({
  imports: [
    MikroOrmModule.forFeature([EventPassSchema, SubscriptionSchema, SubscriptionPlanSchema, PaymentMethodSchema]),
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
    {
      provide: I_SUBSCRIPTION_PLAN_REPOSITORY,
      useClass: MikroOrmSubscriptionPlanRepository,
    },
    ActivateEventPassUseCase,
    CheckSubscriptionUseCase,
    SubscribeUseCase,
    CheckFeatureUseCase,
    GetOrganizationFeaturesUseCase,
    FeatureGuard,
    SubscribeMonthlyUseCase,
  ],
  exports: [
    I_EVENT_PASS_REPOSITORY,
    I_SUBSCRIPTION_REPOSITORY,
    I_SUBSCRIPTION_PLAN_REPOSITORY,
    ActivateEventPassUseCase,
    CheckSubscriptionUseCase,
    SubscribeUseCase,
    CheckFeatureUseCase,
    GetOrganizationFeaturesUseCase,
    FeatureGuard,
    SubscribeMonthlyUseCase,
  ],
})
export class SubscriptionModule {}
