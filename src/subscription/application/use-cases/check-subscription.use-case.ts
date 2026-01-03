import { Inject, Injectable } from '@nestjs/common';
import { IEventPassRepository, I_EVENT_PASS_REPOSITORY } from '../../domain/ports/event-pass.repository.interface';

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
  ) {}

  async execute(command: CheckSubscriptionCommand): Promise<CheckSubscriptionResult> {
    const { organizationId } = command;

    // Check for active Event Pass
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
