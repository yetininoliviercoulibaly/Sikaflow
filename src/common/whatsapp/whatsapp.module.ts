import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WhatsAppService } from './whatsapp.service';
import { I_WHATSAPP_SERVICE } from './whatsapp.service.interface';

@Module({
  imports: [HttpModule],
  providers: [
    {
      provide: I_WHATSAPP_SERVICE,
      useClass: WhatsAppService,
    },
    WhatsAppService, // Keep concrete for now if others use it directly, or remove if we are sure. Review said "others might use it". Ideally remove concrete.
  ],
  exports: [I_WHATSAPP_SERVICE, WhatsAppService], // Export both for transition
})
export class WhatsAppModule {}
