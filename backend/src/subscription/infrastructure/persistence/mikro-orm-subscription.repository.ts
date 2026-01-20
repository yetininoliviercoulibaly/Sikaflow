import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { Subscription, SubscriptionStatus } from '../../domain/subscription.entity';
import { ISubscriptionRepository } from '../../domain/ports/subscription.repository.interface';

@Injectable()
export class MikroOrmSubscriptionRepository implements ISubscriptionRepository {
  constructor(private readonly em: EntityManager) {}

  /**
   * Get EntityManager - forks if no request context (e.g., cron jobs)
   */
  private getEm(): EntityManager {
    try {
      // Try to get the context-aware EM
      return this.em.getContext();
    } catch {
      // No request context (cron job), fork the global EM
      return this.em.fork();
    }
  }

  async create(subscription: Subscription): Promise<Subscription> {
    const em = this.getEm();
    const newSub = em.create(Subscription, subscription);
    await em.persistAndFlush(newSub);
    return newSub;
  }

  async findByOrganizationId(organizationId: string): Promise<Subscription | null> {
    const em = this.getEm();
    const subs = await em.find(
      Subscription,
      { organizationId },
      { orderBy: { currentPeriodEnd: 'DESC' }, limit: 1 }
    );
    return subs[0] || null;
  }

  async findAllActive(): Promise<Subscription[]> {
      const em = this.getEm();
      const now = new Date();
      return em.find(Subscription, {
          status: SubscriptionStatus.ACTIVE,
          currentPeriodEnd: { $gt: now }
      });
  }

  async findByStripeSubscriptionId(stripeSubscriptionId: string): Promise<Subscription | null> {
    const em = this.getEm();
    return em.findOne(Subscription, { stripeSubscriptionId });
  }

  async update(subscription: Subscription): Promise<Subscription> {
    const em = this.getEm();
    const existing = await em.findOne(Subscription, { id: subscription.id });
    if (existing) {
        em.assign(existing, subscription);
        await em.flush();
        return existing;
    }
    return subscription;
  }
}
