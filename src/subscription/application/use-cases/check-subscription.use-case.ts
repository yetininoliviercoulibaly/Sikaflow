import { Inject, Injectable } from '@nestjs/common';
import { IEventPassRepository, I_EVENT_PASS_REPOSITORY } from '../../domain/ports/event-pass.repository.interface';
import { ISubscriptionRepository, I_SUBSCRIPTION_REPOSITORY } from '../../domain/ports/subscription.repository.interface';
import { SubscriptionStatus } from '../../domain/subscription.entity';

export interface CheckSubscriptionCommand {
  organizationId: string;
}

export interface CheckSubscriptionResult {
  hasAccess: boolean;
  reason: string;
  expiresAt?: Date;
}

@Injectable()
export class CheckSubscriptionUseCase {
  constructor(
    @Inject(I_EVENT_PASS_REPOSITORY)
    private readonly eventPassRepository: IEventPassRepository,
    @Inject(I_SUBSCRIPTION_REPOSITORY)
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}

  async execute(command: CheckSubscriptionCommand): Promise<CheckSubscriptionResult> {
    const { organizationId } = command;

    // 1. Check Monthly Subscription
    const subscription = await this.subscriptionRepository.findByOrganizationId(organizationId);
    if (subscription && subscription.status === SubscriptionStatus.ACTIVE && subscription.currentPeriodEnd > new Date()) {
        return {
           hasAccess: true,
           reason: 'Abonnement Mensuel Actif',
           expiresAt: subscription.currentPeriodEnd
        };
    }

    // 2. Check Event Pass
    const activePass = await this.eventPassRepository.findActiveForOrganization(organizationId);
    
    if (activePass && activePass.isActive()) {
      return {
        hasAccess: true,
        reason: 'Event Pass actif',
        expiresAt: activePass.validUntil,
      };
    }

    // TODO: Check for SaaS subscription (US.12 - future implementation)
    // const subscription = await subscriptionRepository.findActiveForOrganization(organizationId);
    // if (subscription) { return { hasAccess: true, reason: 'Abonnement actif' }; }

    return {
      hasAccess: false,
      reason: 'Aucun abonnement ou pass actif',
    };
  }
}
