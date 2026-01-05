import { EntitySchema } from '@mikro-orm/core';
import { OnboardingProgress, OnboardingStepId } from '../../domain/onboarding-progress.entity';

/**
 * MikroORM EntitySchema for OnboardingProgress.
 * Maps the pure POJO domain entity to the database.
 * Following the Domain Purity Rule - no decorators on domain entities.
 */
export const OnboardingProgressSchema = new EntitySchema<OnboardingProgress>({
  name: 'OnboardingProgress',
  tableName: 'onboarding_progress',
  properties: {
    id: { type: 'uuid', primary: true },
    userId: { type: 'string', index: true },
    organizationId: { type: 'string', index: true },
    role: { type: 'string' },
    completedSteps: { type: 'json', default: '[]' },
    currentStep: { type: 'string', nullable: true },
    startedAt: { type: 'datetime', onCreate: () => new Date() },
    completedAt: { type: 'datetime', nullable: true },
  },
  indexes: [
    { properties: ['userId', 'organizationId'], name: 'idx_onboarding_user_org' },
  ],
});
