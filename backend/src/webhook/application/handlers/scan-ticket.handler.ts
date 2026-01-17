
import { Injectable } from '@nestjs/common';
import { IActionHandler, ActionContext } from './action-handler.interface';
import { ScanTicketUseCase } from '../../../ticketing/application/use-cases/scan-ticket.use-case';
import { CheckFeatureUseCase } from '../../../subscription/application/use-cases/check-feature.use-case';
import { FeatureFlag } from '../../../subscription/domain/feature-flag.enum';
import { LLMIntent } from '../../../common/llm/llm-types';

@Injectable()
export class ScanTicketHandler implements IActionHandler {
  constructor(
    private readonly scanTicketUseCase: ScanTicketUseCase,
    private readonly checkFeatureUseCase: CheckFeatureUseCase,
  ) {}

  canHandle(intent: string): boolean {
    return intent === LLMIntent.SCAN_TICKET || intent === LLMIntent.SCAN_RESULT;
  }

  async handle(data: any, context: ActionContext): Promise<void> {
    const { senderPhoneNumber, messagingService } = context;
    // mediaId should be passed in data from the message strategy
    const mediaId = data.mediaId;
    const mimeType = data.mimeType;

    if (!mediaId) {
        return;
    }

    // Check Feature Access (Stock/Ticketing)
    const organizationId = context.organizationId;
    if (organizationId) {
        const { hasAccess } = await this.checkFeatureUseCase.execute({
            organizationId,
            feature: FeatureFlag.STOCK_MANAGEMENT // Using STOCK as proxy for Ticketing
        });

        if (!hasAccess) {
             await messagingService.sendMessage(senderPhoneNumber, "🔒 Fonctionnalité non incluse dans votre abonnement.");
             return;
        }
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
