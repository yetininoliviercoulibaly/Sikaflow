
import { Seeder } from '@mikro-orm/seeder';
import { EntityManager } from '@mikro-orm/core';
import { PaymentMethodSeeder } from './PaymentMethodSeeder';
import { SubscriptionPlanSeeder } from './SubscriptionPlanSeeder';
import { PromptTemplateSeeder } from './PromptTemplateSeeder';
import { OnboardingStepSeeder } from './OnboardingStepSeeder';

export class DatabaseSeeder extends Seeder {

  async run(em: EntityManager): Promise<void> {
    return this.call(em, [
        PaymentMethodSeeder,
        SubscriptionPlanSeeder,
        PromptTemplateSeeder,
        OnboardingStepSeeder
    ]);
  }

}
