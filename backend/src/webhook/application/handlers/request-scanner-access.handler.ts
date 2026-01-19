import { Injectable, Logger } from '@nestjs/common';
import { IActionHandler, ActionContext } from './action-handler.interface';
import { RequestMagicLinkUseCase } from '../../../auth/application/use-cases/request-magic-link.use-case';
import { LLMIntent } from '../../../common/llm/llm-types';

@Injectable()
export class RequestScannerAccessHandler implements IActionHandler {
  private readonly logger = new Logger(RequestScannerAccessHandler.name);

  constructor(
    private readonly requestMagicLinkUseCase: RequestMagicLinkUseCase,
  ) {}

  canHandle(intent: string): boolean {
    return intent === LLMIntent.REQUEST_SCANNER_ACCESS;
  }

  async handle(data: any, context: ActionContext): Promise<void> {
    const { senderPhoneNumber, messagingService } = context;
    const isEn = context.language === 'en';

    try {
      // Generate and send magic link for SCANNER
      await this.requestMagicLinkUseCase.execute(senderPhoneNumber, messagingService, 'scanner');

      const message = isEn
        ? `🔐 *Scanner Access Link Sent!*\n\nA secure login link has been sent to your current chat. Click it to access the Ticket Scanner.\n\n_Link expires in 15 minutes._`
        : `🔐 *Lien Scanner envoyé !*\n\nUn lien de connexion sécurisé a été envoyé. Cliquez dessus pour accéder au Scanner de Billets.\n\n_Le lien expire dans 15 minutes._`;

      await messagingService.sendMessage(senderPhoneNumber, message);
      
      this.logger.log(`Magic link sent to ${senderPhoneNumber} for scanner access`);
    } catch (error) {
      this.logger.error(`Error sending magic link for scanner: ${error.message}`, error.stack);
      
      const errorMessage = isEn
        ? `❌ Error sending access link. Please try again later.`
        : `❌ Erreur lors de l'envoi du lien d'accès. Veuillez réessayer plus tard.`;
      
      await messagingService.sendMessage(senderPhoneNumber, errorMessage);
    }
  }
}
