import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ProcessMessageUseCase } from '../use-cases/process-message.use-case';
import { WhatsAppPayloadDto } from '../dtos/whatsapp-payload.dto';

@Processor('whatsapp')
export class MessageProcessor extends WorkerHost {
  private readonly logger = new Logger(MessageProcessor.name);

  constructor(
    private readonly processMessageUseCase: ProcessMessageUseCase,
  ) {
    super();
  }

  async process(job: Job<WhatsAppPayloadDto, any, string>): Promise<any> {
    this.logger.log(`[Queue] Processing job ${job.id} for message`);
    try {
        await this.processMessageUseCase.execute(job.data);
        this.logger.log(`[Queue] Job ${job.id} completed`);
    } catch (error) {
        this.logger.error(`[Queue] Job ${job.id} failed`, error);
        throw error;
    }
  }
}
