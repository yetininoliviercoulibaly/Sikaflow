import { Injectable, Inject, Logger } from '@nestjs/common';
import { BusinessIntelligenceService } from '../services/business-intelligence.service';
import { IMessagingService, I_MESSAGING_SERVICE } from '../../../common/messaging/messaging.service.interface';
import { ISubscriptionRepository, I_SUBSCRIPTION_REPOSITORY } from '../../../subscription/domain/ports/subscription.repository.interface';
import { IOrganizationRepository, I_ORGANIZATION_REPOSITORY } from '../../../organization/domain/ports/organization.repository.interface';
import { IUserRepository, I_USER_REPOSITORY } from '../../../user/domain/ports/user.repository.interface';
import { getCurrency } from '../../../common/utils/currency.util';

@Injectable()
export class GenerateDailyReportUseCase {
  private readonly logger = new Logger(GenerateDailyReportUseCase.name);

  constructor(
    private readonly biService: BusinessIntelligenceService,
    @Inject(I_MESSAGING_SERVICE) private readonly messagingService: IMessagingService,
    @Inject(I_SUBSCRIPTION_REPOSITORY) private readonly subscriptionRepository: ISubscriptionRepository,
    @Inject(I_ORGANIZATION_REPOSITORY) private readonly organizationRepository: IOrganizationRepository,
    @Inject(I_USER_REPOSITORY) private readonly userRepository: IUserRepository,
  ) {}

  async execute(): Promise<void> {
    this.logger.log('🌅 Starting Daily Report Generation...');

    // 1. Get ONLY Active Subscriptions (Monthly)
    const activeSubs = await this.subscriptionRepository.findAllActive();
    
    // Deduplicate Org IDs
    const orgIds = new Set<string>();
    activeSubs.forEach(s => orgIds.add(s.organizationId));

    if (orgIds.size === 0) {
        this.logger.log('No active subscriptions found for daily report.');
        return;
    }

    this.logger.log(`Found ${orgIds.size} organizations to report.`);

    // 2. Define Time Range: YESTERDAY
    const today = new Date();
    
    // Yesterday Start/End
    const yesterdayStart = new Date(today);
    yesterdayStart.setDate(today.getDate() - 1);
    yesterdayStart.setHours(0, 0, 0, 0);

    const yesterdayEnd = new Date(today);
    yesterdayEnd.setDate(today.getDate() - 1);
    yesterdayEnd.setHours(23, 59, 59, 999);

    // Day Before Yesterday (For Trend)
    const dayBeforeStart = new Date(yesterdayStart);
    dayBeforeStart.setDate(yesterdayStart.getDate() - 1);

    const dayBeforeEnd = new Date(yesterdayEnd);
    dayBeforeEnd.setDate(yesterdayEnd.getDate() - 1);

    // 3. Generate for each Org
    for (const orgId of orgIds) {
        await this.generateForOrg(orgId, yesterdayStart, yesterdayEnd, dayBeforeStart, dayBeforeEnd);
    }
  }

  private async generateForOrg(
      orgId: string, 
      currentStart: Date, currentEnd: Date, 
      prevStart: Date, prevEnd: Date
  ) {
      try {
          // Get Owner
          const ownerMember = await this.organizationRepository.findOwner(orgId);
          if (!ownerMember) return;
          const user = await this.userRepository.findById(ownerMember.userId);
          if (!user || !user.phoneNumber) return;

          // Metrics
          const revCurrent = await this.biService.getRawMetric(orgId, 'REVENUE', currentStart, currentEnd);
          const revPrev = await this.biService.getRawMetric(orgId, 'REVENUE', prevStart, prevEnd);
          
          const expCurrent = await this.biService.getRawMetric(orgId, 'EXPENSES', currentStart, currentEnd);
          // const expPrev = await this.biService.getRawMetric(orgId, 'EXPENSES', prevStart, prevEnd);

          // Growth (Revenue only for Daily Flash is usually enough, but let's keep it simple)
          const revGrowth = this.calculateGrowth(revPrev, revCurrent);

          // Format
          const currency = getCurrency(); 
          const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n);

          // Emojis based on performance
          const performanceEmoji = revCurrent >= revPrev ? '📈' : '📉';

          const message = `🌅 *Flash Quotidien* (${currentStart.toLocaleDateString('fr-FR')})

💰 *Chiffre d'Affaires* : ${fmt(revCurrent)} ${currency}
   ${this.formatGrowth(revGrowth)} vs veille (${fmt(revPrev)})

💸 *Dépenses* : ${fmt(expCurrent)} ${currency}

*Net* : ${fmt(revCurrent - expCurrent)} ${currency}

_SikaFlow AI_`;

          await this.messagingService.sendMessage(user.phoneNumber, message);
          this.logger.log(`Daily Report sent to ${orgId}`);

      } catch (e) {
          this.logger.error(`Failed to generate daily report for ${orgId}`, e);
      }
  }

  private calculateGrowth(prev: number, current: number): number {
      if (prev === 0) return current > 0 ? 100 : 0;
      return ((current - prev) / prev) * 100;
  }

  private formatGrowth(growth: number): string {
      if (growth > 0) return `🟢 +${growth.toFixed(1)}%`;
      if (growth < 0) return `🔴 ${growth.toFixed(1)}%`;
      return `⚪ 0%`;
  }
}
