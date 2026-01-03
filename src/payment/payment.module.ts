import { Module } from '@nestjs/common';
import { HttpModule, HttpService } from '@nestjs/axios';
import { PAYMENT_PROVIDER_TOKEN } from './domain/ports/payment-provider.interface';
import { StripePaymentProvider } from './infrastructure/stripe-payment.provider';
import { WavePaymentProvider } from './infrastructure/wave-payment.provider';

@Module({
  imports: [HttpModule],
  providers: [
    StripePaymentProvider,
    WavePaymentProvider,
    {
      provide: PAYMENT_PROVIDER_TOKEN,
      useFactory: (httpService: HttpService) => {
        // Select provider based on region configuration
        const region = process.env.PAYMENT_REGION || 'INTERNATIONAL';
        
        if (region === 'AFRICA' || region === 'XOF') {
          return new WavePaymentProvider(httpService);
        }
        
        return new StripePaymentProvider();
      },
      inject: [HttpService],
    },
  ],
  exports: [PAYMENT_PROVIDER_TOKEN, StripePaymentProvider, WavePaymentProvider],
})
export class PaymentModule {}

