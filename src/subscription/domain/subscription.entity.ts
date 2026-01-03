import { v4 } from 'uuid';

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELED = 'CANCELED',
  PAST_DUE = 'PAST_DUE',
  EXPIRED = 'EXPIRED',
}

export enum SubscriptionType {
  MONTHLY = 'MONTHLY',
}

export class Subscription {
  id: string = v4();
  organizationId: string;
  stripeSubscriptionId?: string;
  waveTransactionId?: string;
  type: SubscriptionType = SubscriptionType.MONTHLY;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  createdAt: Date = new Date();
  updatedAt: Date = new Date();

  constructor(
    organizationId: string,
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    status: SubscriptionStatus = SubscriptionStatus.ACTIVE,
    stripeSubscriptionId?: string,
  ) {
    this.organizationId = organizationId;
    this.currentPeriodStart = currentPeriodStart;
    this.currentPeriodEnd = currentPeriodEnd;
    this.status = status;
    this.stripeSubscriptionId = stripeSubscriptionId;
  }
}
