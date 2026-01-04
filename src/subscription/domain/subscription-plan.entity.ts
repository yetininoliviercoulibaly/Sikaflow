
import { v4 } from 'uuid';
import { PaymentMethod } from '../../payment/domain/payment-method.entity';
import { FeatureFlag } from './feature-flag.enum';

export class SubscriptionPlan {
  id: string = v4();
  name!: string; // 'Pass Trimestriel', 'Premium Mensuel'
  price!: number;
  currency!: string; // 'XOF', 'EUR'
  durationMonths!: number; // 1, 3, 12
  paymentMethod!: PaymentMethod;
  description?: string;
  enabledFeatures: FeatureFlag[] = []; // Features included in this plan
  isActive: boolean = true;
  createdAt: Date = new Date();
  updatedAt: Date = new Date();
}

