import { Module } from '@nestjs/common';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { TelegramModule } from '../telegram/telegram.module';
import { WhatsAppMessagingAdapter } from './whatsapp-messaging.adapter';
import { TelegramMessagingAdapter } from './telegram-messaging.adapter';
import { I_MESSAGING_SERVICE } from './messaging.service.interface';

/**
 * Module providing platform-agnostic messaging adapters
 * Both WhatsApp and Telegram adapters are exported for use in webhook processing
 */
@Module({
  imports: [WhatsAppModule, TelegramModule],
  providers: [
    WhatsAppMessagingAdapter, 
    TelegramMessagingAdapter,
    {
      provide: I_MESSAGING_SERVICE,
      useExisting: WhatsAppMessagingAdapter,
    }
  ],
  exports: [WhatsAppMessagingAdapter, TelegramMessagingAdapter, I_MESSAGING_SERVICE],
})
export class MessagingModule {}
