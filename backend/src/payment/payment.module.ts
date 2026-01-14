import { Module, forwardRef } from '@nestjs/common';
import { HttpModule, HttpService } from '@nestjs/axios';
import { PAYMENT_PROVIDER_TOKEN } from './domain/ports/payment-provider.interface';
import { StripePaymentProvider } from './infrastructure/stripe-payment.provider';
import { WavePaymentProvider } from './infrastructure/wave-payment.provider';
import { PaymentWebhookController } from './application/controllers/payment-webhook.controller';
import { SubscriptionModule } from '../subscription/subscription.module';
import { OrganizationModule } from '../organization/organization.module';
import { UserModule } from '../user/user.module';
import { WhatsAppModule } from '../common/whatsapp/whatsapp.module';
import { TicketingModule } from '../ticketing/ticketing.module';

@Module({
  imports: [
    HttpModule,
    forwardRef(() => SubscriptionModule), // For ActivateEventPassUseCase
    forwardRef(() => TicketingModule),
    OrganizationModule, // For Repositories
    UserModule,
    WhatsAppModule
  ],
  controllers: [PaymentWebhookController],
  providers: [
    StripePaymentProvider,
    WavePaymentProvider,
    {
      provide: PAYMENT_PROVIDER_TOKEN,
      useFactory: (httpService: HttpService) => {
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


