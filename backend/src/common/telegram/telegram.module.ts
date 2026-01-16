import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { TelegramService } from './telegram.service';
import { I_TELEGRAM_SERVICE } from './telegram.service.interface';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [
    {
      provide: I_TELEGRAM_SERVICE,
      useClass: TelegramService,
    },
    TelegramService,
  ],
  exports: [I_TELEGRAM_SERVICE, TelegramService],
})
export class TelegramModule {}
