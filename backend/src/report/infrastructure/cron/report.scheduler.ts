import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GenerateDailyReportUseCase } from '../../application/use-cases/generate-daily-report.use-case';

@Injectable()
export class ReportScheduler {
  private readonly logger = new Logger(ReportScheduler.name);

  constructor(private readonly generateReportUseCase: GenerateDailyReportUseCase) {}

  @Cron('0 9 * * *') // Every Day at 09:00 AM
  async handleDailyReports() {
    this.logger.log('⏰ Triggering Daily Report Job...');
    await this.generateReportUseCase.execute();
    this.logger.log('✅ Daily Report Job Completed.');
  }
}
