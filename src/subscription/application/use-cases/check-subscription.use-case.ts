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
  /** In-memory cache to avoid repeated subscription checks (30s TTL) */
  private readonly accessCache = new Map<string, { result: CheckSubscriptionResult; expires: number }>();
  private readonly CACHE_TTL_MS = 30 * 1000; // 30 seconds

  constructor(
    @Inject(I_EVENT_PASS_REPOSITORY)
    private readonly eventPassRepository: IEventPassRepository,
    @Inject(I_SUBSCRIPTION_REPOSITORY)
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}

  async execute(command: CheckSubscriptionCommand): Promise<CheckSubscriptionResult> {
    const { organizationId } = command;

    // Check cache first
    const cached = this.accessCache.get(organizationId);
    if (cached && cached.expires > Date.now()) {
      return cached.result;
    }

    // 1. Check Monthly Subscription
    const subscription = await this.subscriptionRepository.findByOrganizationId(organizationId);
    if (subscription && subscription.status === SubscriptionStatus.ACTIVE && subscription.currentPeriodEnd > new Date()) {
        const result: CheckSubscriptionResult = {
           hasAccess: true,
           reason: 'Abonnement Mensuel Actif',
           expiresAt: subscription.currentPeriodEnd
        };
        this.cacheResult(organizationId, result);
        return result;
    }

    // 2. Check Event Pass
    const activePass = await this.eventPassRepository.findActiveForOrganization(organizationId);
    
    if (activePass && activePass.isActive()) {
      const result: CheckSubscriptionResult = {
        hasAccess: true,
        reason: 'Event Pass actif',
        expiresAt: activePass.validUntil,
      };
      this.cacheResult(organizationId, result);
      return result;
    }

    // No active subscription or pass
    const result: CheckSubscriptionResult = {
      hasAccess: false,
      reason: 'Aucun abonnement ou pass actif',
    };
    this.cacheResult(organizationId, result);
    return result;
  }

  /** Store result in cache with TTL */
  private cacheResult(organizationId: string, result: CheckSubscriptionResult): void {
    this.accessCache.set(organizationId, {
      result,
      expires: Date.now() + this.CACHE_TTL_MS,
    });
  }
}
