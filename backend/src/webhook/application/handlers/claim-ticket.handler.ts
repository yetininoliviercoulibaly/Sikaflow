
import { Injectable, Logger } from '@nestjs/common';
import { IActionHandler, ActionContext } from './action-handler.interface';
import { ClaimTicketUseCase } from '../../../ticketing/application/use-cases/claim-ticket.use-case';
import { LLMIntent } from '../../../common/llm/llm-types';

@Injectable()
export class ClaimTicketHandler implements IActionHandler {
  private readonly logger = new Logger(ClaimTicketHandler.name);

  constructor(
    private readonly claimTicketUseCase: ClaimTicketUseCase,
  ) {}

  canHandle(intent: string): boolean {
    return intent === LLMIntent.CLAIM_TICKET_REGEX;
  }

  async handle(data: any, context: ActionContext): Promise<void> {
    const { senderPhoneNumber, messageBody, messagingService } = context;
    
    if (!messageBody) {
         await messagingService.sendMessage(senderPhoneNumber, "❌ Impossible de lire le message.");
         return;
    }

    // Extract token from message: "CLAIM-TK-XYZ..."
    const match = messageBody.match(/CLAIM-(TK-[A-Z0-9]+)/);
    if (!match) {
        await messagingService.sendMessage(senderPhoneNumber, "❌ Format du lien invalide.");
        return;
    }
    
    const token = match[1];

    try {
        await this.claimTicketUseCase.execute(token, senderPhoneNumber, messagingService);
        // Success message sent by UseCase
    } catch (e) {
        await messagingService.sendMessage(senderPhoneNumber, `❌ Erreur : ${e.message}`);
    }
  }
}
