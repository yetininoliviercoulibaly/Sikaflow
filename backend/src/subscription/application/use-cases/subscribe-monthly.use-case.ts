import { Inject, Injectable } from '@nestjs/common';
import { ISubscriptionRepository, I_SUBSCRIPTION_REPOSITORY } from '../../domain/ports/subscription.repository.interface';
import { IPaymentProvider, PAYMENT_PROVIDER_TOKEN } from '../../../payment/domain/ports/payment-provider.interface';

@Injectable()
export class SubscribeMonthlyUseCase {
  constructor(
    @Inject(I_SUBSCRIPTION_REPOSITORY)
    private readonly subscriptionRepository: ISubscriptionRepository,
    @Inject(PAYMENT_PROVIDER_TOKEN)
    private readonly paymentProvider: IPaymentProvider,
  ) {}

  async execute(organizationId: string, returnUrl: string): Promise<{ paymentLink: string }> {
    // Check if already subscribed?
    const existing = await this.subscriptionRepository.findByOrganizationId(organizationId);
    if (existing && existing.status === 'ACTIVE' && existing.currentPeriodEnd > new Date()) {
       // Already active. But maybe they want to update payment method?
       // For MVP, just allow creating new checkout which might create duplicate if not careful.
       // But Stripe Customer Portal matches email.
       // Let's assume this starts a new subscription flows.
    }

    // Create Checkout Session
    // We need a PRICE_ID for legal/accounting.
    // For Africa (Wave), it's a fixed amount (e.g. 5000 XOF).
    // For International (Stripe), it's a Price ID.
    // The provider implementation should handle "defaults" if no priceId provided, or we pass it via env/config.

    const paymentLink = await this.paymentProvider.createSubscriptionCheckoutSession(
        process.env.MONTHLY_PRICE_ID || 'price_default', // Provider should fallback or use this
        { organizationId, type: 'SUBSCRIPTION' }
    );

    return { paymentLink };
  }
}
