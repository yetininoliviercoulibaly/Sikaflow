import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Inject, Logger } from '@nestjs/common';
import { IPdfGeneratorService, PDF_GENERATOR_SERVICE } from '../../domain/ports/pdf-generator-service.interface';
import { WhatsAppMessagingAdapter } from '../../../common/messaging/whatsapp-messaging.adapter';
import { TelegramMessagingAdapter } from '../../../common/messaging/telegram-messaging.adapter';
import { IMessagingService } from '../../../common/messaging/messaging.service.interface';
import { MessagingPlatforms } from '../../../common/messaging/domain/constants/messaging-platforms.enum';
import { EntityManager } from '@mikro-orm/core';
import { Transaction } from '../../../transaction/domain/transaction.entity';
import { Incident } from '../../../incident/domain/incident.entity';

@Processor('reports')
export class ReportProcessor extends WorkerHost {
  private readonly logger = new Logger(ReportProcessor.name);

  constructor(
    @Inject(PDF_GENERATOR_SERVICE) private readonly pdfGenerator: IPdfGeneratorService,
    private readonly whatsAppAdapter: WhatsAppMessagingAdapter,
    private readonly telegramAdapter: TelegramMessagingAdapter,
    private readonly em: EntityManager,
  ) {
    super();
  }

  /**
   * Selects the appropriate messaging adapter based on platform
   */
  private getMessagingService(platform: MessagingPlatforms): IMessagingService {
    return platform === MessagingPlatforms.TELEGRAM
      ? this.telegramAdapter
      : this.whatsAppAdapter;
  }

  async process(job: Job<any, any, string>): Promise<any> {
    if (job.name === 'generate-report') {
        return this.handleGenerateReport(job);
    } 
  }

  async handleGenerateReport(job: Job): Promise<void> {
      this.logger.log(`Generating report for ${job.data.phoneNumber}`);
      const { phoneNumber, organizationId, platform } = job.data;

      // Select the correct messaging service based on platform
      const messagingService = this.getMessagingService(platform || MessagingPlatforms.WHATSAPP);

      // 1. Fetch Data (Mock Last 10 transactions)
      const transactions = await this.em.find(Transaction, {}, { limit: 10, orderBy: { transactionDate: 'DESC' } });
      const incidents = await this.em.find(Incident, {}, { limit: 5, orderBy: { occurredAt: 'DESC' } });

      // 2. Generate PDF
      const pdfBuffer = await this.pdfGenerator.generateReportPdf({
          title: `Flash Report - ${new Date().toLocaleDateString()}`,
          items: [
              ...transactions.map(t => `[${t.type}] ${t.amount} ${t.currency} - ${t.description}`),
              ...incidents.map(i => `[INCIDENT] ${i.severity} - ${i.description}`)
          ]
      });

      // 3. Send via platform-agnostic messaging
      await messagingService.sendDocument(phoneNumber, pdfBuffer, 'report.pdf', 'Voici votre Flash Report');
      
      this.logger.log(`Report sent to ${phoneNumber} via ${platform || 'WHATSAPP'}`);
  }
}
