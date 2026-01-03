import { Controller, Post, Body, Headers, BadRequestException, Logger, Inject } from '@nestjs/common';
import { ActivateEventPassUseCase } from '../../../subscription/application/use-cases/activate-event-pass.use-case';
import { WhatsAppService } from '../../../common/whatsapp/whatsapp.service';
import { IOrganizationRepository, I_ORGANIZATION_REPOSITORY } from '../../../organization/domain/ports/organization.repository.interface';
import { IUserRepository, I_USER_REPOSITORY } from '../../../user/domain/ports/user.repository.interface';
import { ISubscriptionRepository, I_SUBSCRIPTION_REPOSITORY } from '../../../subscription/domain/ports/subscription.repository.interface';
import { Subscription, SubscriptionStatus, SubscriptionType } from '../../../subscription/domain/subscription.entity';

@Controller('payment/webhook')
export class PaymentWebhookController {
  private readonly logger = new Logger(PaymentWebhookController.name);

  constructor(
    private readonly activateEventPassUseCase: ActivateEventPassUseCase,
    private readonly whatsAppService: WhatsAppService,
    @Inject(I_ORGANIZATION_REPOSITORY) private readonly organizationRepository: IOrganizationRepository,
    @Inject(I_USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(I_SUBSCRIPTION_REPOSITORY) private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}

  @Post('stripe')
  async handleStripeWebhook(@Body() body: any, @Headers('stripe-signature') signature: string) {
    const event = body;

    if (event.type === 'checkout.session.completed' || event.type === 'invoice.payment_succeeded') {
      const session = event.data.object;
      const metadata = session.metadata || session.subscription_details?.metadata || {}; 
      const organizationId = metadata.organizationId;

      if (organizationId) {
        this.logger.log(`Handling Stripe payment for organization ${organizationId}`);
        await this.processSuccessPayment(metadata, 'STRIPE', session.id);
      }
    }
    return { received: true };
  }

  @Post('wave')
  async handleWaveWebhook(@Body() body: any, @Headers('x-wave-signature') signature: string) {
    const event = body;

    if (event.type === 'checkout.session.completed') { 
        const organizationId = event.data.client_reference;
        const paymentReference = event.data.id;
        const metadata = event.data.metadata || { organizationId };

        if (organizationId) {
            this.logger.log(`Handling Wave payment for organization ${organizationId}`);
            await this.processSuccessPayment(metadata, 'WAVE', paymentReference);
        }
    }
    return { received: true };
  }

  private async processSuccessPayment(metadata: any, provider: 'STRIPE' | 'WAVE', reference: string) {
    const organizationId = metadata.organizationId;
    if (!organizationId) return;

    try {
        if (metadata.type === 'SUBSCRIPTION' || metadata.isValuesSubscription === 'true') {
             await this.handleSubscriptionPayment(organizationId, provider, reference);
        } else {
             await this.handleEventPassPayment(organizationId, provider, reference);
        }
    } catch (error) {
        this.logger.error(`Failed to process payment webhook for ${organizationId}`, error);
    }
  }

  private async handleEventPassPayment(organizationId: string, provider: string, reference: string) {
        const result = await this.activateEventPassUseCase.execute({
            organizationId,
            paymentReference: reference,
            provider
        });

        if (result.success && result.pass) {
            await this.notifyOwner(organizationId, `🎉 *Paiement Reçu !*\n\nLe Pass Événement pour votre organisation est activé jusqu'au ${result.pass.validUntil.toLocaleString('fr-FR')}.\n\nVous avez accès à toutes les fonctionnalités !`);
            this.logger.log(`Pass activated successfully for ${organizationId}. Notification sent.`);
        }
  }

  private async handleSubscriptionPayment(organizationId: string, provider: 'STRIPE' | 'WAVE', reference: string) {
       let subscription = await this.subscriptionRepository.findByOrganizationId(organizationId);
       
       const now = new Date();
       let startDate = now;
       let endDate = new Date(now);
       endDate.setDate(endDate.getDate() + 30); // 30 days default
       
       if (subscription && subscription.currentPeriodEnd > now) {
           startDate = subscription.currentPeriodStart; 
           const newEnd = new Date(subscription.currentPeriodEnd);
           newEnd.setDate(newEnd.getDate() + 30);
           endDate = newEnd;
       }

       if (!subscription) {
           subscription = new Subscription(organizationId, startDate, endDate, SubscriptionStatus.ACTIVE, provider === 'STRIPE' ? reference : undefined);
           subscription.waveTransactionId = provider === 'WAVE' ? reference : undefined;
           await this.subscriptionRepository.create(subscription);
       } else {
           subscription.currentPeriodEnd = endDate;
           subscription.status = SubscriptionStatus.ACTIVE;
           await this.subscriptionRepository.update(subscription);
       }

       await this.notifyOwner(organizationId, `💎 *Abonnement Mensuel Activé !*\n\nMerci pour votre confiance. Vous avez un accès illimité jusqu'au ${endDate.toLocaleDateString('fr-FR')}.`);
       this.logger.log(`Subscription activated/extended for ${organizationId}`);
  }

  private async notifyOwner(organizationId: string, message: string) {
      const ownerMember = await this.organizationRepository.findOwner(organizationId);     
      if (ownerMember) {
            const user = await this.userRepository.findById(ownerMember.userId);
            if (user && user.phoneNumber) {
                await this.whatsAppService.sendMessage(user.phoneNumber, message);
            }
      }
  }
}
