import { SubscriptionPlan } from '../subscription-plan.entity';

export const I_SUBSCRIPTION_PLAN_REPOSITORY = 'I_SUBSCRIPTION_PLAN_REPOSITORY';

export interface ISubscriptionPlanRepository {
  findById(id: string): Promise<SubscriptionPlan | null>;
  findAll(): Promise<SubscriptionPlan[]>;
  findActive(): Promise<SubscriptionPlan[]>;
  create(plan: SubscriptionPlan): Promise<SubscriptionPlan>;
  update(plan: SubscriptionPlan): Promise<SubscriptionPlan>;
}
