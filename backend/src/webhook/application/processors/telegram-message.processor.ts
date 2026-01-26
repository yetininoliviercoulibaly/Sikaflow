import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ProcessUnifiedMessageUseCase } from '../use-cases/process-unified-message.use-case';
import { TelegramUpdateDto } from '../dtos/telegram-payload.dto';
import { MikroORM, RequestContext } from '@mikro-orm/core';
import { TelegramParserService } from '../../infrastructure/telegram/telegram-parser.service';
import { TelegramMessagingAdapter } from '../../../common/messaging/telegram-messaging.adapter';

/**
 * BullMQ processor for Telegram message queue
 * Processes incoming Telegram updates asynchronously
 */
@Processor('telegram')
export class TelegramMessageProcessor extends WorkerHost {
  private readonly logger = new Logger(TelegramMessageProcessor.name);

  constructor(
    private readonly processUnifiedMessageUseCase: ProcessUnifiedMessageUseCase,
    private readonly telegramParser: TelegramParserService,
    private readonly telegramAdapter: TelegramMessagingAdapter,
    private readonly orm: MikroORM,
  ) {
    super();
  }

  async process(job: Job<TelegramUpdateDto, any, string>): Promise<any> {
    this.logger.log(`[Queue] Processing Telegram job ${job.id}`);

    // Wrap in RequestContext to get a fresh EntityManager for this job
    return RequestContext.create(this.orm.em, async () => {
      try {
        const unifiedMessage = this.telegramParser.parse(job.data);
        if (unifiedMessage) {
            await this.processUnifiedMessageUseCase.execute(unifiedMessage, this.telegramAdapter);
        } else {
            this.logger.debug('Could not parse Telegram update or ignored message type');
        }
        this.logger.log(`[Queue] Telegram job ${job.id} completed`);
      } catch (error) {
        this.logger.error(`[Queue] Telegram job ${job.id} failed`, error);
        throw error;
      }
    });
  }
}
