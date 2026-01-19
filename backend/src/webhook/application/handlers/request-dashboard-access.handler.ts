import { Injectable, Logger } from '@nestjs/common';
import { IActionHandler, ActionContext } from './action-handler.interface';
import { RequestMagicLinkUseCase } from '../../../auth/application/use-cases/request-magic-link.use-case';
import { LLMIntent } from '../../../common/llm/llm-types';

@Injectable()
export class RequestDashboardAccessHandler implements IActionHandler {
  private readonly logger = new Logger(RequestDashboardAccessHandler.name);

  constructor(
    private readonly requestMagicLinkUseCase: RequestMagicLinkUseCase,
  ) {}

  canHandle(intent: string): boolean {
    return intent === LLMIntent.REQUEST_DASHBOARD_ACCESS;
  }

  async handle(data: any, context: ActionContext): Promise<void> {
    const { senderPhoneNumber, messagingService } = context;
    const isEn = context.language === 'en';

    try {
      // Generate and send magic link
      await this.requestMagicLinkUseCase.execute(senderPhoneNumber);

      const message = isEn
        ? `🔐 *Dashboard Access Link Sent!*\n\nA secure login link has been sent to your current chat. Click it to access:\n- 📊 Event Dashboard\n- 📷 Ticket Scanner\n\n_Link expires in 15 minutes._`
        : `🔐 *Lien d'accès envoyé !*\n\nUn lien de connexion sécurisé a été envoyé dans cette conversation. Cliquez dessus pour accéder :\n- 📊 Tableau de bord événements\n- 📷 Scanner de billets\n\n_Le lien expire dans 15 minutes._`;

      await messagingService.sendMessage(senderPhoneNumber, message);
      
      this.logger.log(`Magic link sent to ${senderPhoneNumber} for dashboard access`);
    } catch (error) {
      this.logger.error(`Error sending magic link: ${error.message}`, error.stack);
      
      const errorMessage = isEn
        ? `❌ Error sending access link. Please try again later.`
        : `❌ Erreur lors de l'envoi du lien d'accès. Veuillez réessayer plus tard.`;
      
      await messagingService.sendMessage(senderPhoneNumber, errorMessage);
    }
  }
}
