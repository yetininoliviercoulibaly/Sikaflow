
import { Injectable, Inject, Logger } from '@nestjs/common';
import { IActionHandler, ActionContext } from './action-handler.interface';
import { GenerateClaimLinkUseCase } from '../../../ticketing/application/use-cases/generate-claim-link.use-case';
import { IEventRepository, I_EVENT_REPOSITORY } from '../../../ticketing/domain/ports/event.repository.interface';
import { LLMIntent } from '../../../common/llm/llm-types';

@Injectable()
export class GenerateClaimHandler implements IActionHandler {
  private readonly logger = new Logger(GenerateClaimHandler.name);
  
  // Base URL for deep links (should be in env, but using generic wa.me for now)
  private readonly botPhone = process.env.WHATSAPP_PHONE_ID_DISPLAY || '2250707070707'; 

  constructor(
    private readonly generateClaimLinkUseCase: GenerateClaimLinkUseCase,
    @Inject(I_EVENT_REPOSITORY) private readonly eventRepository: IEventRepository,
  ) {}

  canHandle(intent: string): boolean {
    return intent === LLMIntent.GENERATE_CLAIM_LINKS;
  }

  async handle(data: any, context: ActionContext): Promise<void> {
    const { senderPhoneNumber, organizationId, messagingService, platform } = context;
    const quantity = data.quantity || 1;
    
    const isEn = context.language === 'en';

    if (!organizationId) {
        await messagingService.sendMessage(senderPhoneNumber, isEn 
            ? "❌ You must be in an organization context." 
            : "❌ Vous devez être dans le contexte d'une organisation.");
        return;
    }

    // Find by Name if provided
    let event;
    if (data.event_name) {
         const orgEvents = await this.eventRepository.findByOrganizationId(organizationId);
         const found = orgEvents.find(e => e.name.toLowerCase().includes(data.event_name.toLowerCase()));
         
         if (!found) {
             const msg = isEn 
                ? `❌ No event found for "${data.event_name}".`
                : `❌ Aucun événement trouvé pour "${data.event_name}" dans votre organisation.`;
             await messagingService.sendMessage(senderPhoneNumber, msg);
             return;
         }
         event = found;
    } else {
         // Smart Resolution: Find all upcoming events
         const allEvents = await this.eventRepository.findByOrganizationId(organizationId);
         const now = new Date();
         const upcomingEvents = allEvents.filter(e => e.date >= now).sort((a, b) => a.date.getTime() - b.date.getTime());

         if (upcomingEvents.length === 1) {
             event = upcomingEvents[0];
         } else if (upcomingEvents.length > 1) {
             let msg = isEn 
                ? "❌ Multiple upcoming events. Did you mean:\n\n"
                : "❌ Plusieurs événements à venir. Précisez le nom :\n\n";
             upcomingEvents.forEach(e => msg += `- ${e.name} (${e.date.toLocaleDateString()})\n`);
             await messagingService.sendMessage(senderPhoneNumber, msg);
             return;
         } else {
             await messagingService.sendMessage(senderPhoneNumber, isEn
                ? "❌ No upcoming events found."
                : "❌ Aucun événement à venir trouvé. Veuillez en créer un d'abord.");
             return;
         }
    }

    try {
        const claims = await this.generateClaimLinkUseCase.execute(event.id, organizationId, quantity);
        
        // Format Response - platform aware deep links
        let response = isEn
            ? `✅ *${quantity} Links Generated* for ${event.name} :\n\n`
            : `✅ *${quantity} Liens Générés* pour ${event.name} :\n\n`;

        claims.forEach((c, idx) => {
             // Create Deep Link based on platform
             let link: string;
             if (platform === 'telegram') {
                 // Telegram deep link format
                 const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'SikaFlowBot';
                 link = `https://t.me/${botUsername}?start=CLAIM-${c.token}`;
             } else {
                 // WhatsApp deep link format
                 link = `https://wa.me/${this.botPhone}?text=CLAIM-${c.token}`;
             }
             response += `${idx + 1}. ${link}\n`;
        });
        
        response += isEn
            ? `\nShare these links individually.`
            : `\nPartagez ces liens individuellement avec les bénéficiaires.`;
        
        await messagingService.sendMessage(senderPhoneNumber, response);

    } catch (error) {
        this.logger.error(error);
        await messagingService.sendMessage(senderPhoneNumber, `❌ Error : ${error.message}`);
    }
  }
}
