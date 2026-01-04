
import { Injectable, Inject, Logger } from '@nestjs/common';
import { IActionHandler, ActionContext } from './action-handler.interface';
import { ClaimTicketUseCase } from '../../../ticketing/application/use-cases/claim-ticket.use-case';
import { IWhatsAppService, I_WHATSAPP_SERVICE } from '../../../common/whatsapp/whatsapp.service.interface';

@Injectable()
export class ClaimTicketHandler implements IActionHandler {
  private readonly logger = new Logger(ClaimTicketHandler.name);

  constructor(
    @Inject(I_WHATSAPP_SERVICE) private readonly whatsAppService: IWhatsAppService,
    private readonly claimTicketUseCase: ClaimTicketUseCase,
  ) {}

  canHandle(intent: string): boolean {
    return intent === 'CLAIM_TICKET_REGEX'; // Special flag, logic actually in ProcessMessage usually checks regex 
    // OR ProcessMessage detects regex and sets intent to CLAIM_TICKET
  }

  // Actually, standard pattern: ProcessMessage calls LLM. 
  // If message matches regex, we should bypass LLM or have LLM return 'CLAIM_TICKET'.
  // Since "CLAIM-TOKEN" is a code, LLM might be confused.
  // Better: In `ProcessMessageUseCase`, check regex first. If match -> intent = CLAIM_TICKET.

  async handle(data: any, context: ActionContext): Promise<void> {
    const { senderPhoneNumber, messageBody } = context;
    
    if (!messageBody) {
         await this.whatsAppService.sendMessage(senderPhoneNumber, "❌ Impossible de lire le message.");
         return;
    }

    // Extract token from message: "CLAIM-TK-XYZ..."
    // Regex: /CLAIM-(TK-[A-Z0-9]+)/
    
    const match = messageBody.match(/CLAIM-(TK-[A-Z0-9]+)/);
    if (!match) {
        await this.whatsAppService.sendMessage(senderPhoneNumber, "❌ Format du lien invalide.");
        return;
    }
    
    const token = match[1]; // The Token part

    try {
        await this.claimTicketUseCase.execute(token, senderPhoneNumber);
        // Success message sent by UseCase
    } catch (e) {
        await this.whatsAppService.sendMessage(senderPhoneNumber, `❌ Erreur : ${e.message}`);
    }
  }
}
