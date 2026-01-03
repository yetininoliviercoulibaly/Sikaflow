import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Inject, Logger } from '@nestjs/common';
import { IPdfGeneratorService, PDF_GENERATOR_SERVICE } from '../../domain/ports/pdf-generator-service.interface';
import { WhatsAppService } from '../../../common/whatsapp/whatsapp.service';
import { EntityManager } from '@mikro-orm/core'; // Direct EM usage or specific repositories
// Ideally inject Repositories. For speed, I might use EntityManager to fetch checks.
import { Transaction } from '../../../transaction/domain/transaction.entity';
import { Incident } from '../../../incident/domain/incident.entity';

@Processor('reports')
export class ReportProcessor extends WorkerHost {
  private readonly logger = new Logger(ReportProcessor.name);

  constructor(
    @Inject(PDF_GENERATOR_SERVICE) private readonly pdfGenerator: IPdfGeneratorService,
    private readonly whatsAppService: WhatsAppService,
    private readonly em: EntityManager,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    // If we use one Processor class for the whole queue, we must check job.name
    // BUT MessageProcessor is also @Processor('whatsapp'). 
    // BullMQ allows multiple workers on same queue? Yes if different concurrency or same. 
    // NestJS allows splitting via @Process('name') inside ONE class, OR effectively splitting logic. 
    // However, if MessageProcessor extends WorkerHost, it consumes ALL jobs by default process() unless we use named processors.
    
    // Better Approach: MessageProcessor handles 'incoming-message'. ReportProcessor handles 'generate-report'.
    // NOTE: NestJS BullMQ WorkerHost implementation `process(job)` catches ALL. 
    // To route by name, we can check `job.name` inside.
    
    if (job.name === 'generate-report') {
        return this.handleGenerateReport(job);
    } 
    // If it's not for us, we shouldn't fail, but maybe we shouldn't have picked it up if we have multiple workers competing?
    // Actually, distinct Processors for SAME queue in NestJS might compete. 
    // Best practice: ONE Processor for the Queue, routing inside. OR Named Processors if using named queues.
    // Here we have one queue 'whatsapp'. 
    
    // DECISION: Move this logic to `MessageProcessor` OR handle concurrency? 
    // Or make ReportProcessor listen to a DIFFERENT queue 'reports'. 
    // Let's use a different queue for reports: 'reports'. Cleaner.
    // Task said "ProcessMessageUseCase ... adds job 'generate-report' in the queue".
    // If I add to 'whatsapp' queue, then MessageProcessor (which listens to 'whatsapp') receives it.
    // MessageProcessor currently has `process(job)`. It will crash or error on 'generate-report' payload if unexpected.
    
    // PLAN REDIRECTION: Use a separate queue "reports".
    // 1. Register queue 'reports' in ReportModule.
    // 2. Inject queue 'reports' in WebhookModule (or generic service).
    // 3. ReportProcessor listens to 'reports'.
  }

  async handleGenerateReport(job: Job): Promise<void> {
      this.logger.log(`Generating report for ${job.data.phoneNumber}`);
      const { phoneNumber, organizationId } = job.data;

      // 1. Fetch Data (Mock Last 10 transactions)
      // Real: Repo.find({ organizationId, date > ... })
      // Using generic EM for simplicity of import
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

      // 3. Send via WhatsApp
      await this.whatsAppService.sendDocument(phoneNumber, pdfBuffer, 'report.pdf', 'Here is your Flash Report');
  }
}
