import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { SubscriptionPlan } from '../../domain/subscription-plan.entity';
import { ISubscriptionPlanRepository } from '../../domain/ports/subscription-plan.repository.interface';

/**
 * MikroORM adapter implementing the ISubscriptionPlanRepository port.
 */
@Injectable()
export class MikroOrmSubscriptionPlanRepository implements ISubscriptionPlanRepository {
  constructor(private readonly em: EntityManager) {}

  async findById(id: string): Promise<SubscriptionPlan | null> {
    return this.em.findOne('SubscriptionPlan', { id }) as Promise<SubscriptionPlan | null>;
  }

  async findAll(): Promise<SubscriptionPlan[]> {
    return this.em.find('SubscriptionPlan', {}) as Promise<SubscriptionPlan[]>;
  }

  async findActive(): Promise<SubscriptionPlan[]> {
    return this.em.find('SubscriptionPlan', { isActive: true }) as Promise<SubscriptionPlan[]>;
  }

  async create(plan: SubscriptionPlan): Promise<SubscriptionPlan> {
    this.em.persist(plan);
    await this.em.flush();
    return plan;
  }

  async update(plan: SubscriptionPlan): Promise<SubscriptionPlan> {
    const existing = await this.em.findOne('SubscriptionPlan', { id: plan.id });
    if (existing) {
      Object.assign(existing, plan);
      await this.em.flush();
      return existing as SubscriptionPlan;
    }
    throw new Error(`SubscriptionPlan with id ${plan.id} not found`);
  }
}
