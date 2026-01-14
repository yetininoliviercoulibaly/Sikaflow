
import { EntitySchema } from '@mikro-orm/core';
import { SubscriptionPlan } from '../../domain/subscription-plan.entity';

export const SubscriptionPlanSchema = new EntitySchema<SubscriptionPlan>({
  class: SubscriptionPlan,
  tableName: 'subscription_plan',
  properties: {
    id: { type: 'uuid', primary: true },
    name: { type: 'string' },
    price: { type: 'decimal', precision: 10, scale: 2 },
    currency: { type: 'string' },
    durationMonths: { type: 'integer' },
    paymentMethod: { kind: 'm:1', entity: 'PaymentMethod' },
    description: { type: 'text', nullable: true },
    enabledFeatures: { type: 'json', default: '[]' },
    isActive: { type: 'boolean', default: true },
    createdAt: { type: 'datetime', defaultRaw: 'CURRENT_TIMESTAMP' },
    updatedAt: { type: 'datetime', defaultRaw: 'CURRENT_TIMESTAMP', onUpdate: () => new Date() },
  },
});

