
import { Injectable, Inject } from '@nestjs/common';
import { IActionHandler } from './action-handler.interface';
import { ScanTicketUseCase } from '../../../ticketing/application/use-cases/scan-ticket.use-case';
import { IWhatsAppService, I_WHATSAPP_SERVICE } from '../../../common/whatsapp/whatsapp.service.interface';
import { LLMIntent } from '../../../common/llm/llm-types';

@Injectable()
export class ScanTicketHandler implements IActionHandler {
  constructor(
    private readonly scanTicketUseCase: ScanTicketUseCase,
    @Inject(I_WHATSAPP_SERVICE) private readonly whatsAppService: IWhatsAppService,
  ) {}

  canHandle(intent: string): boolean {
    return intent === 'SCAN_TICKET' || intent === 'SCAN_RESULT'; // Supporting both just in case
  }

  async handle(data: any, context: any): Promise<void> {
    const { senderPhoneNumber, mediaId, mimeType } = context; // Assuming context has media info for Image messages

    if (!mediaId) {
        // Should not happen if intent is SCAN_TICKET derived from Image
        return;
    }

    try {
        // Download Image
        const { buffer } = await this.whatsAppService.downloadMedia(mediaId);
        
        // Execute Scan Logic
        const response = await this.scanTicketUseCase.execute(buffer, mimeType || 'image/jpeg', senderPhoneNumber);
        
        await this.whatsAppService.sendMessage(senderPhoneNumber, response);

    } catch (e) {
        await this.whatsAppService.sendMessage(senderPhoneNumber, `❌ Erreur de scan: ${e.message}`);
    }
  }
}
