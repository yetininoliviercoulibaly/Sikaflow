
import { Injectable } from '@nestjs/common';
import { IActionHandler, ActionContext } from './action-handler.interface';
import { ScanTicketUseCase } from '../../../ticketing/application/use-cases/scan-ticket.use-case';

@Injectable()
export class ScanTicketHandler implements IActionHandler {
  constructor(
    private readonly scanTicketUseCase: ScanTicketUseCase,
  ) {}

  canHandle(intent: string): boolean {
    return intent === 'SCAN_TICKET' || intent === 'SCAN_RESULT';
  }

  async handle(data: any, context: ActionContext): Promise<void> {
    const { senderPhoneNumber, messagingService } = context;
    // mediaId should be passed in data from the message strategy
    const mediaId = data.mediaId;
    const mimeType = data.mimeType;

    if (!mediaId) {
        return;
    }

    try {
        // Download Image using platform-agnostic service
        const { buffer } = await messagingService.downloadMedia(mediaId);
        
        // Execute Scan Logic
        const response = await this.scanTicketUseCase.execute(buffer, mimeType || 'image/jpeg', senderPhoneNumber);
        
        await messagingService.sendMessage(senderPhoneNumber, response);

    } catch (e) {
        await messagingService.sendMessage(senderPhoneNumber, `❌ Erreur de scan: ${e.message}`);
    }
  }
}
