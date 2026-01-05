import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { Subscription, SubscriptionStatus } from '../../domain/subscription.entity';
import { ISubscriptionRepository } from '../../domain/ports/subscription.repository.interface';

@Injectable()
export class MikroOrmSubscriptionRepository implements ISubscriptionRepository {
  constructor(private readonly em: EntityManager) {}

  async create(subscription: Subscription): Promise<Subscription> {
    const newSub = this.em.create(Subscription, subscription);
    await this.em.persistAndFlush(newSub);
    return newSub;
  }

  async findByOrganizationId(organizationId: string): Promise<Subscription | null> {
    const subs = await this.em.find(
      Subscription,
      { organizationId },
      { orderBy: { currentPeriodEnd: 'DESC' }, limit: 1 }
    );
    return subs[0] || null;
  }

  async findAllActive(): Promise<Subscription[]> {
      const now = new Date();
      return this.em.find(Subscription, {
          status: SubscriptionStatus.ACTIVE,
          currentPeriodEnd: { $gt: now }
      });
  }

  async findByStripeSubscriptionId(stripeSubscriptionId: string): Promise<Subscription | null> {
    return this.em.findOne(Subscription, { stripeSubscriptionId });
  }

  async update(subscription: Subscription): Promise<Subscription> {
    const existing = await this.em.findOne(Subscription, { id: subscription.id });
    if (existing) {
        this.em.assign(existing, subscription);
        await this.em.flush();
        return existing;
    }
    return subscription;
  }
}
