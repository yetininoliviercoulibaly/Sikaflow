import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ProcessTelegramMessageUseCase } from '../use-cases/process-telegram-message.use-case';
import { TelegramUpdateDto } from '../dtos/telegram-payload.dto';
import { MikroORM, RequestContext } from '@mikro-orm/core';

/**
 * BullMQ processor for Telegram message queue
 * Processes incoming Telegram updates asynchronously
 */
@Processor('telegram')
export class TelegramMessageProcessor extends WorkerHost {
  private readonly logger = new Logger(TelegramMessageProcessor.name);

  constructor(
    private readonly processMessageUseCase: ProcessTelegramMessageUseCase,
    private readonly orm: MikroORM,
  ) {
    super();
  }

  async process(job: Job<TelegramUpdateDto, any, string>): Promise<any> {
    this.logger.log(`[Queue] Processing Telegram job ${job.id}`);

    // Wrap in RequestContext to get a fresh EntityManager for this job
    return RequestContext.create(this.orm.em, async () => {
      try {
        await this.processMessageUseCase.execute(job.data);
        this.logger.log(`[Queue] Telegram job ${job.id} completed`);
      } catch (error) {
        this.logger.error(`[Queue] Telegram job ${job.id} failed`, error);
        throw error;
      }
    });
  }
}
