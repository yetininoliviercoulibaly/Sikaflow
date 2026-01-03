import { Controller, Get, Post, Body, Query, ForbiddenException, HttpCode, HttpStatus } from '@nestjs/common';
import { WhatsAppPayloadDto } from '../dtos/whatsapp-payload.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Controller('webhook')
export class WhatsAppController {
  constructor(
    @InjectQueue('whatsapp') private readonly whatsappQueue: Queue,
  ) {}

  @Get()
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    const WEBHOOK_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

    if (mode && token) {
      if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
        console.log('WEBHOOK_VERIFIED');
        return challenge;
      } else {
        throw new ForbiddenException();
      }
    }
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleIncomingWebhook(@Body() payload: WhatsAppPayloadDto) {
    // Push to Queue immediately
    await this.whatsappQueue.add('incoming-message', payload, {
        removeOnComplete: true,
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
    });

    return { status: 'EVENT_QUEUED' };
  }
}
