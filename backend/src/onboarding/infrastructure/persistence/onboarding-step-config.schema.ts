import { EntitySchema } from '@mikro-orm/core';
import { OnboardingStepConfig } from '../../domain/onboarding-step-config.entity';

/**
 * MikroORM EntitySchema for OnboardingStepConfig.
 * Stores onboarding step definitions in database for dynamic configuration.
 */
export const OnboardingStepConfigSchema = new EntitySchema<OnboardingStepConfig>({
  name: 'OnboardingStepConfig',
  tableName: 'onboarding_step_config',
  properties: {
    id: { type: 'uuid', primary: true },
    stepId: { type: 'string', index: true },
    planId: { type: 'string', nullable: true, index: true },
    title: { type: 'string' },
    description: { type: 'text' },
    tipMessage: { type: 'text' },
    completionMessage: { type: 'text' },
    requiredRoles: { type: 'json', default: '[]' },
    order: { type: 'integer', default: 0 },
    isActive: { type: 'boolean', default: true },
    createdAt: { type: 'datetime', onCreate: () => new Date() },
    updatedAt: { type: 'datetime', onUpdate: () => new Date() },
  },
  indexes: [
    { properties: ['planId', 'stepId'], name: 'idx_step_config_plan_step' },
  ],
});
