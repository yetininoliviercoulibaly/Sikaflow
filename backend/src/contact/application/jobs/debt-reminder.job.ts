import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MikroORM, CreateRequestContext } from '@mikro-orm/core';
import { I_CONTACT_REPOSITORY, IContactRepository } from '../../domain/ports/contact.repository.interface';
import { I_USER_REPOSITORY, IUserRepository } from '../../../user/domain/ports/user.repository.interface';
import { I_MESSAGING_SERVICE, IMessagingService } from '../../../common/messaging/messaging.service.interface';

/**
 * CronJob that runs daily to notify users about overdue debts
 * Sends a summary to users who have contacts with pending debts
 */
@Injectable()
export class DebtReminderJob {
  private readonly logger = new Logger(DebtReminderJob.name);

  constructor(
    private readonly orm: MikroORM,
    @Inject(I_CONTACT_REPOSITORY)
    private readonly contactRepository: IContactRepository,
    @Inject(I_USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(I_MESSAGING_SERVICE)
    private readonly messagingService: IMessagingService,
  ) {}

  /**
   * Run every day at 9:00 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  @CreateRequestContext()
  async handleDebtReminders(): Promise<void> {
    this.logger.log('🔔 Starting Debt Reminder Job...');

    try {
      // Get all users
      const users = await this.userRepository.findAll();
      
      let notifiedCount = 0;

      for (const user of users) {
        if (!user.phoneNumber) continue;

        // Get contacts with pending debts for this user
        const contactsWithDebts = await this.contactRepository.findWithPendingDebts(user.id);

        if (contactsWithDebts.length === 0) continue;

        // Calculate totals and identify overdue contacts
        const now = Date.now();
        const overdueContacts = contactsWithDebts.filter((c) => {
          const daysSinceLastInteraction = Math.floor(
            (now - c.lastInteractionAt.getTime()) / (1000 * 60 * 60 * 24),
          );
          return daysSinceLastInteraction >= 7; // Consider overdue after 7 days
        });

        if (overdueContacts.length === 0) continue;

        // Build summary message
        const totalOwed = overdueContacts.reduce((sum, c) => sum + c.totalOwed, 0);
        const topDebtors = overdueContacts
          .sort((a, b) => b.totalOwed - a.totalOwed)
          .slice(0, 5);

        const list = topDebtors
          .map((c) => {
            const days = Math.floor(
              (now - c.lastInteractionAt.getTime()) / (1000 * 60 * 60 * 24),
            );
            return `• ${c.displayName}: ${c.totalOwed.toLocaleString('fr-FR')}F ⏰ ${days}j`;
          })
          .join('\n');

        const moreCount = overdueContacts.length > 5 
          ? `\n... et ${overdueContacts.length - 5} autres` 
          : '';

        const message = `🔔 *Rappel Créances*

Vous avez *${overdueContacts.length} contact(s)* avec créances en retard:

${list}${moreCount}

💰 *Total: ${totalOwed.toLocaleString('fr-FR')}F*

💡 Répondez "Relance [nom]" pour envoyer un rappel.

_SikaFlow - Agent de Recouvrement_`;

        await this.messagingService.sendMessage(user.phoneNumber, message);
        notifiedCount++;
        
        this.logger.log(`Debt reminder sent to user ${user.id} (${overdueContacts.length} overdue contacts)`);
      }

      this.logger.log(`✅ Debt Reminder Job completed. Notified ${notifiedCount} users.`);
    } catch (error) {
      this.logger.error('❌ Debt Reminder Job failed', error);
    }
  }

  /**
   * Manual trigger method for testing
   */
  async triggerManually(): Promise<{ notifiedCount: number }> {
    await this.handleDebtReminders();
    return { notifiedCount: 0 }; // Actual count logged, this is just for API response
  }
}
