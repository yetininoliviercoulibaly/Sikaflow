import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { TelegramUpdateDto } from '../dtos/telegram-payload.dto';
import { TelegramSignatureGuard } from '../guards/telegram-signature.guard';

/**
 * Controller for handling Telegram Bot webhook events
 * 
 * Unlike WhatsApp which requires a GET verification endpoint,
 * Telegram webhooks are set up via the setWebhook API call.
 */
@Controller('webhook/telegram')
export class TelegramController {
  constructor(
    @InjectQueue('telegram') private readonly telegramQueue: Queue,
  ) {}

  /**
   * Handle incoming Telegram updates (messages, callback queries, etc.)
   */
  @Post()
  @UseGuards(TelegramSignatureGuard)
  @HttpCode(HttpStatus.OK)
  async handleIncomingWebhook(@Body() payload: TelegramUpdateDto) {
    // Push to Queue for async processing
    await this.telegramQueue.add('incoming-update', payload, {
      removeOnComplete: true,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    });

    // Telegram expects a 200 OK response quickly
    return { status: 'EVENT_QUEUED' };
  }
}
