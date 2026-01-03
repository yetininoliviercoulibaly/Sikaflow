import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { EventPassSchema } from './infrastructure/persistence/event-pass.schema';
import { MikroOrmEventPassRepository } from './infrastructure/persistence/mikro-orm-event-pass.repository';
import { I_EVENT_PASS_REPOSITORY } from './domain/ports/event-pass.repository.interface';
import { ActivateEventPassUseCase } from './application/use-cases/activate-event-pass.use-case';
import { CheckSubscriptionUseCase } from './application/use-cases/check-subscription.use-case';
import { PaymentModule } from '../payment/payment.module';
import { OrganizationModule } from '../organization/organization.module';

@Module({
  imports: [
    MikroOrmModule.forFeature([EventPassSchema]),
    PaymentModule,
    OrganizationModule,
  ],
  providers: [
    {
      provide: I_EVENT_PASS_REPOSITORY,
      useClass: MikroOrmEventPassRepository,
    },
    ActivateEventPassUseCase,
    CheckSubscriptionUseCase,
  ],
  exports: [
    I_EVENT_PASS_REPOSITORY,
    ActivateEventPassUseCase,
    CheckSubscriptionUseCase,
  ],
})
export class SubscriptionModule {}
