import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ProcessMessageUseCase } from '../use-cases/process-message.use-case';
import { WhatsAppPayloadDto } from '../dtos/whatsapp-payload.dto';
import { MikroORM, RequestContext } from '@mikro-orm/core';
import { WhatsAppParserService } from '../../infrastructure/whatsapp/whatsapp-parser.service';
import { WhatsAppMessagingAdapter } from '../../../common/messaging/whatsapp-messaging.adapter';

@Processor('whatsapp')
export class MessageProcessor extends WorkerHost {
  private readonly logger = new Logger(MessageProcessor.name);

  constructor(
    private readonly processMessageUseCase: ProcessMessageUseCase,
    private readonly whatsAppParser: WhatsAppParserService,
    private readonly whatsAppAdapter: WhatsAppMessagingAdapter,
    private readonly orm: MikroORM,
  ) {
    super();
  }

  async process(job: Job<WhatsAppPayloadDto, any, string>): Promise<any> {
    this.logger.log(`[Queue] Processing WhatsApp job ${job.id}`);
    
    return RequestContext.create(this.orm.em, async () => {
      try {
        const unifiedMessages = this.whatsAppParser.parse(job.data);
        for (const msg of unifiedMessages) {
          await this.processMessageUseCase.execute(msg, this.whatsAppAdapter);
        }
        this.logger.log(`[Queue] WhatsApp job ${job.id} completed`);
      } catch (error) {
        this.logger.error(`[Queue] WhatsApp job ${job.id} failed`, error);
        throw error;
      }
    });
  }
}

