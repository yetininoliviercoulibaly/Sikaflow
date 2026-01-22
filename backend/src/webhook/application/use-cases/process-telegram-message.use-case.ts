import { Injectable, Logger } from '@nestjs/common';
import { TelegramUpdateDto } from '../dtos/telegram-payload.dto';
import { TelegramMessagingAdapter } from '../../../common/messaging/telegram-messaging.adapter';
import { TelegramParserService } from '../../infrastructure/telegram/telegram-parser.service';
import { ProcessMessageUseCase } from './process-message.use-case';

/**
 * Use case for processing incoming Telegram messages
 * REFACTORED: Now a thin wrapper around ProcessMessageUseCase
 */
@Injectable()
export class ProcessTelegramMessageUseCase {
  private readonly logger = new Logger(ProcessTelegramMessageUseCase.name);

  constructor(
    private readonly telegramMessagingAdapter: TelegramMessagingAdapter,
    private readonly telegramParser: TelegramParserService,
    private readonly processMessageUseCase: ProcessMessageUseCase,
  ) {}

  async execute(update: TelegramUpdateDto): Promise<void> {
    const unifiedMessage = this.telegramParser.parse(update);
    
    if (!unifiedMessage) {
       this.logger.debug('Could not parse Telegram update or ignored message type');
       return;
    }

    await this.processMessageUseCase.execute(unifiedMessage, this.telegramMessagingAdapter);
  }
}
