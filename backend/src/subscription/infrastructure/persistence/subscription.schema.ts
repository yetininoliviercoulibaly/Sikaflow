import { EntitySchema } from '@mikro-orm/core';
import { Subscription, SubscriptionStatus, SubscriptionType } from '../../domain/subscription.entity';

export const SubscriptionSchema = new EntitySchema<Subscription>({
  class: Subscription,
  tableName: 'subscriptions',
  properties: {
    id: { type: 'uuid', primary: true },
    organizationId: { type: 'uuid' },
    stripeSubscriptionId: { type: 'string', nullable: true },
    waveTransactionId: { type: 'string', nullable: true },
    type: { enum: true, items: () => SubscriptionType, default: SubscriptionType.MONTHLY },
    status: { enum: true, items: () => SubscriptionStatus, default: SubscriptionStatus.ACTIVE },
    currentPeriodStart: { type: 'datetime' },
    currentPeriodEnd: { type: 'datetime' },
    createdAt: { type: 'datetime' },
    updatedAt: { type: 'datetime', onUpdate: () => new Date() },
  },
});
