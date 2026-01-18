import { Injectable, Logger } from '@nestjs/common';
import { IActionHandler, ActionContext } from './action-handler.interface';
import { GenerateTicketsQRUseCase } from '../../../ticketing/application/use-cases/generate-tickets-qr.use-case';
import { IEventRepository, I_EVENT_REPOSITORY } from '../../../ticketing/domain/ports/event.repository.interface';
import { ITicketCategoryRepository, I_TICKET_CATEGORY_REPOSITORY } from '../../../ticketing/domain/ports/ticket-category.repository.interface';
import { LLMIntent } from '../../../common/llm/llm-types';
import { Inject } from '@nestjs/common';

@Injectable()
export class GenerateTicketsQRHandler implements IActionHandler {
  private readonly logger = new Logger(GenerateTicketsQRHandler.name);

  constructor(
    private readonly generateTicketsQRUseCase: GenerateTicketsQRUseCase,
    @Inject(I_EVENT_REPOSITORY) private readonly eventRepository: IEventRepository,
    @Inject(I_TICKET_CATEGORY_REPOSITORY) private readonly categoryRepository: ITicketCategoryRepository,
  ) {}

  canHandle(intent: string): boolean {
    return intent === LLMIntent.GENERATE_TICKETS_QR;
  }

  async handle(data: any, context: ActionContext): Promise<void> {
    const { senderPhoneNumber, organizationId, messagingService } = context;
    const quantity = data.quantity || 1;
    const categoryName = data.category_name;
    
    const isEn = context.language === 'en';

    if (!organizationId) {
      await messagingService.sendMessage(senderPhoneNumber, isEn 
        ? "❌ You must be in an organization context." 
        : "❌ Vous devez être dans le contexte d'une organisation.");
      return;
    }

    // 1. Resolve Event
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
      // Smart Resolution: Find upcoming event
      const allEvents = await this.eventRepository.findByOrganizationId(organizationId);
      const now = new Date();
      const upcomingEvents = allEvents.filter(e => e.date >= now).sort((a, b) => a.date.getTime() - b.date.getTime());

      if (upcomingEvents.length === 1) {
        event = upcomingEvents[0];
      } else if (upcomingEvents.length > 1) {
        let msg = isEn 
          ? "❌ Multiple upcoming events. Please specify:\n\n"
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

    // 2. Resolve Category if specified
    let categoryId: string | undefined;
    if (categoryName) {
      const categories = await this.categoryRepository.findByEventId(event.id);
      const found = categories.find(c => c.name.toLowerCase().includes(categoryName.toLowerCase()));
      if (!found) {
        const msg = isEn
          ? `❌ Category "${categoryName}" not found. Available: ${categories.map(c => c.name).join(', ')}`
          : `❌ Catégorie "${categoryName}" non trouvée. Disponibles : ${categories.map(c => c.name).join(', ')}`;
        await messagingService.sendMessage(senderPhoneNumber, msg);
        return;
      }
      categoryId = found.id;
    }

    try {
      // 3. Generate tickets
      const result = await this.generateTicketsQRUseCase.execute(event.id, quantity, categoryId);

      // 4. Send confirmation message
      const headerMsg = isEn
        ? `✅ *${quantity} QR Ticket(s) Generated!*\n\n📅 Event: ${result.eventName}\n🏷️ Category: ${result.categoryName}\n\n_Sending QR codes..._`
        : `✅ *${quantity} Billet(s) QR Générés !*\n\n📅 Événement: ${result.eventName}\n🏷️ Catégorie: ${result.categoryName}\n\n_Envoi des QR codes..._`;
      
      await messagingService.sendMessage(senderPhoneNumber, headerMsg);

      // 5. Send QR codes as documents
      for (let i = 0; i < result.tickets.length; i++) {
        const ticket = result.tickets[i];
        const filename = `ticket-${result.eventName.replace(/\s+/g, '-')}-${result.categoryName}-${i + 1}.png`;
        const caption = isEn
          ? `🎫 Ticket ${i + 1}/${quantity} - ${result.categoryName}`
          : `🎫 Billet ${i + 1}/${quantity} - ${result.categoryName}`;
        
        await messagingService.sendDocument(
          senderPhoneNumber,
          ticket.qrBuffer,
          filename,
          caption
        );
      }

      // 6. Final message with instructions
      const footerMsg = isEn
        ? `\n✅ All ${quantity} QR codes sent!\n\n_Distribute these QR codes to your clients. They can be printed or shared digitally._`
        : `\n✅ ${quantity} QR codes envoyés !\n\n_Distribuez ces QR codes à vos clients. Ils peuvent être imprimés ou partagés numériquement._`;
      
      await messagingService.sendMessage(senderPhoneNumber, footerMsg);

    } catch (error) {
      this.logger.error(`Error generating tickets: ${error.message}`, error.stack);
      await messagingService.sendMessage(senderPhoneNumber, `❌ ${isEn ? 'Error' : 'Erreur'}: ${error.message}`);
    }
  }
}
