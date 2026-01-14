import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { OnboardingProgress } from '../../domain/onboarding-progress.entity';
import { IOnboardingRepository } from '../../domain/ports/onboarding.repository.interface';

/**
 * MikroORM adapter implementing the IOnboardingRepository port.
 * Handles persistence operations for OnboardingProgress.
 */
@Injectable()
export class MikroOrmOnboardingRepository implements IOnboardingRepository {
  constructor(private readonly em: EntityManager) {}

  async findByUserId(userId: string): Promise<OnboardingProgress | null> {
    return this.em.findOne('OnboardingProgress', { userId }) as Promise<OnboardingProgress | null>;
  }

  async findByOrganizationId(organizationId: string): Promise<OnboardingProgress[]> {
    return this.em.find('OnboardingProgress', { organizationId }) as Promise<OnboardingProgress[]>;
  }

  async findByUserAndOrganization(
    userId: string,
    organizationId: string,
  ): Promise<OnboardingProgress | null> {
    return this.em.findOne('OnboardingProgress', { userId, organizationId }) as Promise<OnboardingProgress | null>;
  }

  async create(progress: OnboardingProgress): Promise<OnboardingProgress> {
    const entity = this.em.create('OnboardingProgress', progress);
    await this.em.persistAndFlush(entity);
    return entity as unknown as OnboardingProgress;
  }

  async update(progress: OnboardingProgress): Promise<OnboardingProgress> {
    const existing = await this.em.findOne('OnboardingProgress', { id: progress.id });
    if (existing) {
      // Update properties manually to avoid type issues with em.assign
      Object.assign(existing, {
        completedSteps: progress.completedSteps,
        currentStep: progress.currentStep,
        completedAt: progress.completedAt,
      });
      await this.em.flush();
      return existing as OnboardingProgress;
    }
    throw new Error(`OnboardingProgress with id ${progress.id} not found`);
  }
}

