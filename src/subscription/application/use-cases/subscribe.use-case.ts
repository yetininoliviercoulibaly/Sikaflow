
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { PaymentMethod } from '../../../payment/domain/payment-method.entity';
import { SubscriptionPlan } from '../../domain/subscription-plan.entity';
import { WavePaymentProvider } from '../../../payment/infrastructure/wave-payment.provider';
import { StripePaymentProvider } from '../../../payment/infrastructure/stripe-payment.provider';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SubscribeUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly waveProvider: WavePaymentProvider,
    private readonly stripeProvider: StripePaymentProvider,
    private readonly configService: ConfigService,
  ) {}

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    return this.em.find(PaymentMethod, { isActive: true });
  }

  async getPlansData(methodCode: string): Promise<SubscriptionPlan[]> {
    const method = await this.em.findOne(PaymentMethod, { code: methodCode });
    if (!method) return [];
    return this.em.find(SubscriptionPlan, { paymentMethod: method, isActive: true }, { orderBy: { durationMonths: 'ASC' } });
  }

  async execute(planId: string, organizationId: string): Promise<{ paymentLink: string }> {
    const plan = await this.em.findOne(SubscriptionPlan, { id: planId }, { populate: ['paymentMethod'] });
    if (!plan) throw new Error('Plan not found');

    const amount = plan.price;
    const currency = plan.currency;
    const metadata = { organizationId, planId: plan.id, durationMonths: plan.durationMonths.toString() };

    let link = '';
    
    if (plan.paymentMethod.code === 'WAVE') {
        // Wave Provider logic
        link = await this.waveProvider.createPaymentLink(amount, currency, metadata);
    } else if (plan.paymentMethod.code === 'STRIPE') {
        // Stripe Provider logic (Simulated subscription via checkout)
        link = await this.stripeProvider.createPaymentLink(amount, currency, metadata);
    } else {
        throw new Error('Unsupported payment provider');
    }

    return { paymentLink: link };
  }
}
