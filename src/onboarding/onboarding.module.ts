import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { OnboardingProgressSchema } from './infrastructure/persistence/onboarding-progress.schema';
import { OnboardingStepConfigSchema } from './infrastructure/persistence/onboarding-step-config.schema';
import { MikroOrmOnboardingRepository } from './infrastructure/persistence/mikro-orm-onboarding.repository';
import { MikroOrmOnboardingStepConfigRepository } from './infrastructure/persistence/mikro-orm-onboarding-step-config.repository';
import { I_ONBOARDING_REPOSITORY } from './domain/ports/onboarding.repository.interface';
import { I_ONBOARDING_STEP_CONFIG_REPOSITORY } from './domain/ports/onboarding-step-config.repository.interface';
import { StartOnboardingUseCase } from './application/use-cases/start-onboarding.use-case';
import { GetNextStepUseCase } from './application/use-cases/get-next-step.use-case';
import { CompleteStepUseCase } from './application/use-cases/complete-step.use-case';
import { GetAdoptionReportUseCase } from './application/use-cases/get-adoption-report.use-case';
import { OnboardingEventListener } from './application/listeners/onboarding-event.listener';
import { UserModule } from '../user/user.module';
import { WhatsAppModule } from '../common/whatsapp/whatsapp.module';

@Module({
  imports: [
    MikroOrmModule.forFeature([OnboardingProgressSchema, OnboardingStepConfigSchema]),
    UserModule,
    WhatsAppModule,
  ],
  providers: [
    {
      provide: I_ONBOARDING_REPOSITORY,
      useClass: MikroOrmOnboardingRepository,
    },
    {
      provide: I_ONBOARDING_STEP_CONFIG_REPOSITORY,
      useClass: MikroOrmOnboardingStepConfigRepository,
    },
    StartOnboardingUseCase,
    GetNextStepUseCase,
    CompleteStepUseCase,
    GetAdoptionReportUseCase,
    OnboardingEventListener,
  ],
  exports: [
    StartOnboardingUseCase,
    GetNextStepUseCase,
    CompleteStepUseCase,
    GetAdoptionReportUseCase,
    I_ONBOARDING_STEP_CONFIG_REPOSITORY,
  ],
})
export class OnboardingModule {}


