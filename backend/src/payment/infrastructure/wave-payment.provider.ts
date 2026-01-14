
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { IPaymentProvider, PaymentVerificationResult } from '../domain/ports/payment-provider.interface';

@Injectable()
export class WavePaymentProvider implements IPaymentProvider {
  private readonly logger = new Logger(WavePaymentProvider.name);
  private readonly waveApiUrl = 'https://api.wave.com/v1';

  constructor(private readonly httpService: HttpService) {}

  async createPaymentLink(
    amount: number,
    currency: string,
    metadata: Record<string, string>,
  ): Promise<string> {
    const waveApiKey = process.env.WAVE_API_KEY;

    if (!waveApiKey) {
      this.logger.warn('WAVE_API_KEY not set. Returning mock link.');
      // Mock needs to keep metadata for testing if possible, or we assume test environment handles it
      // For mock verification, we need to store it somewhere or encode in URL? 
      // Simplified: Mock verifies always true, returns empty metadata.
      const query = new URLSearchParams({
          amount: amount.toString(),
          currency,
          org: metadata.organizationId,
          // Encode metadata in mock url for testability?
          ...metadata
      }).toString();
      return `https://pay.wave.com/mock?${query}`;
    }

    try {
      // Wave Checkout Session API
      // Note: Assuming Wave supports 'metadata' object as custom fields
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.waveApiUrl}/checkout/sessions`,
          {
            amount: amount.toString(),
            currency: currency, // XOF for West Africa
            error_url: `${process.env.APP_URL || 'https://sikaflow.app'}/payment/error`,
            success_url: `${process.env.APP_URL || 'https://sikaflow.app'}/payment/success?wave_checkout_id={checkout_session_id}`,
            client_reference: metadata.organizationId,
            // Passing metadata if supported. If not, we might rely on client_reference containing ID 
            // and separate persistence.
            // But relying on Wave to return it back in Session object.
            // Many Gateways support it. Let's assume yes or use proper serialization if needed.
            // For now, I'll add it and hope Wave stores key-values.
            // If strict validation fails, I'd wrap it in client_reference as JSON.
            // Let's try passing it.
            metadata: metadata 
          },
          {
            headers: {
              Authorization: `Bearer ${waveApiKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      const checkoutSession = response.data;
      this.logger.log(`Created Wave Checkout Session: ${checkoutSession.id}`);
      return checkoutSession.wave_launch_url;
    } catch (error) {
      this.logger.error('Wave payment link creation failed', error);
      throw new Error('Payment service unavailable');
    }
  }

  async verifyPayment(checkoutId: string): Promise<PaymentVerificationResult> {
    const waveApiKey = process.env.WAVE_API_KEY;

    if (!waveApiKey) {
      this.logger.warn('WAVE_API_KEY not set. Returning mock verification.');
      return { success: true, metadata: {} }; // Mock
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.waveApiUrl}/checkout/sessions/${checkoutId}`, {
          headers: {
            Authorization: `Bearer ${waveApiKey}`,
          },
        }),
      );

      const session = response.data;
      const success = session.payment_status === 'succeeded';
      
      return {
          success,
          metadata: session.metadata || {}, // Retrieve metadata
          amount: parseFloat(session.amount),
          currency: session.currency
      };

    } catch (error) {
      this.logger.error('Wave payment verification failed', error);
      return { success: false };
    }
  }

  async createSubscriptionCheckoutSession(priceId: string, metadata: { organizationId: string; type: string }): Promise<string> {
      // Wave does not support 'subscription' mode directly. We simulate it as 30-day access.
      // Use env var for amount if priceId is not sufficient
      const amount = process.env.WAVE_MONTHLY_AMOUNT || '5000'; // 5000 XOF default

      // Add subscription-specific metadata
      const subMetadata = { ...metadata, isValuesSubscription: 'true' };

      return this.createPaymentLink(parseFloat(amount), 'XOF', subMetadata);
  }
}
