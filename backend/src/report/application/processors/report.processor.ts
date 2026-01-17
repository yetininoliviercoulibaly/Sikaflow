import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Inject, Logger } from '@nestjs/common';
import { IPdfGeneratorService, PDF_GENERATOR_SERVICE } from '../../domain/ports/pdf-generator-service.interface';
import { WhatsAppMessagingAdapter } from '../../../common/messaging/whatsapp-messaging.adapter';
import { TelegramMessagingAdapter } from '../../../common/messaging/telegram-messaging.adapter';
import { IMessagingService } from '../../../common/messaging/messaging.service.interface';
import { MessagingPlatforms } from '../../../common/messaging/domain/constants/messaging-platforms.enum';
import { MikroORM, RequestContext } from '@mikro-orm/core';
import { Transaction } from '../../../transaction/domain/transaction.entity';
import { Incident } from '../../../incident/domain/incident.entity';

@Processor('reports')
export class ReportProcessor extends WorkerHost {
  private readonly logger = new Logger(ReportProcessor.name);

  constructor(
    @Inject(PDF_GENERATOR_SERVICE) private readonly pdfGenerator: IPdfGeneratorService,
    private readonly whatsAppAdapter: WhatsAppMessagingAdapter,
    private readonly telegramAdapter: TelegramMessagingAdapter,
    private readonly orm: MikroORM,
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
        return RequestContext.create(this.orm.em, () => this.handleGenerateReport(job));
    } 
  }

  async handleGenerateReport(job: Job): Promise<void> {
      this.logger.log(`[Job:${job.id}] Generating report for ${job.data.phoneNumber}`);
      const { phoneNumber, organizationId, platform } = job.data;
      
      try {
          // Select the correct messaging service based on platform
          const messagingService = this.getMessagingService(platform || MessagingPlatforms.WHATSAPP);

          // 1. Fetch Data (STRICT ISOLATION)
          const orgId = job.data.organizationId;
          if (!orgId) {
            throw new Error(`[Job:${job.id}] Missing organizationId in job data. Cannot generate report.`);
          }

          this.logger.debug(`[Job:${job.id}] Fetching transactions/incidents for Org:${orgId}...`);
          const transactions = await this.orm.em.find(Transaction, { organizationId: orgId }, { limit: 10, orderBy: { transactionDate: 'DESC' } });
          const incidents = await this.orm.em.find(Incident, { organizationId: orgId }, { limit: 5, orderBy: { occurredAt: 'DESC' } });

          // 1b. Calculate Totals & Translate
          const totalIncome = transactions
            .filter(t => t.type === 'INCOME')
            .reduce((sum, t) => sum + Number(t.amount), 0);
          
          const totalExpense = transactions
            .filter(t => t.type === 'EXPENSE')
            .reduce((sum, t) => sum + Number(t.amount), 0);

          const formattedItems = [
              ...transactions.map(t => ({
                  type: t.type === 'INCOME' ? 'REVENU' : 'DÉPENSE',
                  amount: t.amount,
                  currency: t.currency,
                  description: t.description,
                  date: t.transactionDate
              })),
              ...incidents.map(i => ({
                  type: 'INCIDENT',
                  severity: i.severity,
                  description: i.description,
                  date: i.occurredAt
              }))
          ];

          // 2. Generate PDF
          this.logger.debug(`[Job:${job.id}] Generating PDF...`);
          const pdfBuffer = await this.pdfGenerator.generateReportPdf({
              title: `Flash Report - ${new Date().toLocaleDateString('fr-FR')}`,
              summary: {
                  totalIncome,
                  totalExpense,
                  netChange: totalIncome - totalExpense,
                  currency: transactions[0]?.currency || 'XOF'
              },
              items: formattedItems
          });

          // 3. Send via platform-agnostic messaging
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
          const filename = `report_${timestamp}.pdf`;
          this.logger.debug(`[Job:${job.id}] Sending document ${filename} (${pdfBuffer.length} bytes)...`);
          await messagingService.sendDocument(phoneNumber, pdfBuffer, filename, 'Voici votre Flash Report');
          
          this.logger.log(`[Job:${job.id}] Report sent to ${phoneNumber} via ${platform || 'WHATSAPP'}`);
      } catch (error) {
          this.logger.error(`[Job:${job.id}] Failed to generate report`, error.stack);
          throw error;
      }
  }
}
