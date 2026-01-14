import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { OnboardingStepConfig } from '../../domain/onboarding-step-config.entity';
import { OnboardingStepId } from '../../domain/onboarding-progress.entity';
import { IOnboardingStepConfigRepository } from '../../domain/ports/onboarding-step-config.repository.interface';

/**
 * MikroORM adapter for OnboardingStepConfig.
 */
@Injectable()
export class MikroOrmOnboardingStepConfigRepository implements IOnboardingStepConfigRepository {
  constructor(private readonly em: EntityManager) {}

  async findByPlanId(planId: string | null): Promise<OnboardingStepConfig[]> {
    return this.em.find(
      'OnboardingStepConfig',
      { planId, isActive: true },
      { orderBy: { order: 'ASC' } },
    ) as Promise<OnboardingStepConfig[]>;
  }

  async findStepsForPlan(planId: string | null): Promise<OnboardingStepConfig[]> {
    // Get base steps (planId = null) + plan-specific steps
    const steps = await this.em.find(
      'OnboardingStepConfig',
      { 
        $or: [
          { planId: null },
          { planId },
        ],
        isActive: true,
      },
      { orderBy: { order: 'ASC' } },
    ) as OnboardingStepConfig[];

    return steps;
  }

  async findByStepId(stepId: OnboardingStepId): Promise<OnboardingStepConfig | null> {
    return this.em.findOne('OnboardingStepConfig', { stepId, isActive: true }) as Promise<OnboardingStepConfig | null>;
  }

  async findAllActive(): Promise<OnboardingStepConfig[]> {
    return this.em.find(
      'OnboardingStepConfig',
      { isActive: true },
      { orderBy: { order: 'ASC' } },
    ) as Promise<OnboardingStepConfig[]>;
  }

  async create(config: OnboardingStepConfig): Promise<OnboardingStepConfig> {
    this.em.persist(config);
    await this.em.flush();
    return config;
  }

  async update(config: OnboardingStepConfig): Promise<OnboardingStepConfig> {
    const existing = await this.em.findOne('OnboardingStepConfig', { id: config.id }) as OnboardingStepConfig | null;
    if (existing) {
      Object.assign(existing, config);
      (existing as OnboardingStepConfig).updatedAt = new Date();
      await this.em.flush();
      return existing;
    }
    throw new Error(`OnboardingStepConfig with id ${config.id} not found`);
  }
}
