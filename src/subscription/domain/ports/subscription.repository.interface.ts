import { Subscription } from '../subscription.entity';

export const I_SUBSCRIPTION_REPOSITORY = 'I_SUBSCRIPTION_REPOSITORY';

export interface ISubscriptionRepository {
  create(subscription: Subscription): Promise<Subscription>;
  findByOrganizationId(organizationId: string): Promise<Subscription | null>;
  findByStripeSubscriptionId(stripeSubscriptionId: string): Promise<Subscription | null>;
  findAllActive(): Promise<Subscription[]>;
  update(subscription: Subscription): Promise<Subscription>;
}
