
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CreateRequestContext, MikroORM } from '@mikro-orm/core';
import { SendFeedbackRequestsUseCase } from '../use-cases/send-feedback-requests.use-case';

@Injectable()
export class FeedbackScheduler {
  private readonly logger = new Logger(FeedbackScheduler.name);

  constructor(
    private readonly sendFeedbackRequestsUseCase: SendFeedbackRequestsUseCase,
    private readonly orm: MikroORM,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_2PM)
  @CreateRequestContext()
  async handleDailyFeedback() {
    this.logger.log('Running Daily Feedback Request Job...');
    await this.sendFeedbackRequestsUseCase.execute();
    this.logger.log('Daily Feedback Request Job Completed.');
  }
}
