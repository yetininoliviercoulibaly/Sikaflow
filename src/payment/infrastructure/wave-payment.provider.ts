import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { IPaymentProvider } from '../domain/ports/payment-provider.interface';

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
      return `https://pay.wave.com/mock?amount=${amount}&currency=${currency}&org=${metadata.organizationId}`;
    }

    try {
      // Wave Checkout Session API
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.waveApiUrl}/checkout/sessions`,
          {
            amount: amount.toString(),
            currency: currency, // XOF for West Africa
            error_url: `${process.env.APP_URL || 'https://eventpilot.app'}/payment/error`,
            success_url: `${process.env.APP_URL || 'https://eventpilot.app'}/payment/success?wave_checkout_id={checkout_session_id}`,
            client_reference: metadata.organizationId,
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

  async verifyPayment(checkoutId: string): Promise<boolean> {
    const waveApiKey = process.env.WAVE_API_KEY;

    if (!waveApiKey) {
      this.logger.warn('WAVE_API_KEY not set. Returning mock verification.');
      return true; // Mock for dev
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.waveApiUrl}/checkout/sessions/${checkoutId}`, {
          headers: {
            Authorization: `Bearer ${waveApiKey}`,
          },
        }),
      );

      return response.data.payment_status === 'succeeded';
    } catch (error) {
      this.logger.error('Wave payment verification failed', error);
      return false;
    }
  }
}
