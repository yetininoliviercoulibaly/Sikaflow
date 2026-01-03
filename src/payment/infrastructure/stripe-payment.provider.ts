import { Injectable, Logger } from '@nestjs/common';
import { IPaymentProvider } from '../domain/ports/payment-provider.interface';

@Injectable()
export class StripePaymentProvider implements IPaymentProvider {
  private readonly logger = new Logger(StripePaymentProvider.name);

  async createPaymentLink(
    amount: number,
    currency: string,
    metadata: Record<string, string>,
  ): Promise<string> {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      this.logger.warn('STRIPE_SECRET_KEY not set. Returning mock link.');
      return `https://checkout.stripe.com/mock?amount=${amount}&currency=${currency}&org=${metadata.organizationId}`;
    }

    try {
      // Dynamic import to avoid errors if stripe not installed in all environments
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(stripeSecretKey);

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: currency.toLowerCase(),
              product_data: {
                name: 'Event Pass 48h',
                description: `Pass événement pour ${metadata.organizationName || 'votre organisation'}`,
              },
              unit_amount: Math.round(amount * 100), // Stripe uses cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.APP_URL || 'https://eventpilot.app'}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.APP_URL || 'https://eventpilot.app'}/payment/cancel`,
        metadata: metadata,
      });

      this.logger.log(`Created Stripe Checkout Session: ${session.id}`);
      return session.url || '';
    } catch (error) {
      this.logger.error('Stripe payment link creation failed', error);
      throw new Error('Payment service unavailable');
    }
  }

  async verifyPayment(sessionId: string): Promise<boolean> {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      this.logger.warn('STRIPE_SECRET_KEY not set. Returning mock verification.');
      return true; // Mock for dev
    }

    try {
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(stripeSecretKey);

      const session = await stripe.checkout.sessions.retrieve(sessionId);
      return session.payment_status === 'paid';
    } catch (error) {
      this.logger.error('Stripe payment verification failed', error);
      return false;
    }
  }
}
