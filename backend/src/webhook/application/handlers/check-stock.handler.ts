
import { Injectable, Inject } from '@nestjs/common';
import { IActionHandler, ActionContext } from './action-handler.interface';
import { IWhatsAppService, I_WHATSAPP_SERVICE } from '../../../common/whatsapp/whatsapp.service.interface';
import { IEventRepository, I_EVENT_REPOSITORY } from '../../../ticketing/domain/ports/event.repository.interface';
import { LLMIntent } from '../../../common/llm/llm-types';

@Injectable()
export class CheckStockHandler implements IActionHandler {
  constructor(
    @Inject(I_WHATSAPP_SERVICE) private readonly whatsAppService: IWhatsAppService,
    @Inject(I_EVENT_REPOSITORY) private readonly eventRepository: IEventRepository,
  ) {}

  canHandle(intent: string): boolean {
    return intent === LLMIntent.CHECK_STOCK;
  }

  async handle(data: any, context: ActionContext): Promise<void> {
    const { senderPhoneNumber, organizationId } = context;

    const isEn = context.language === 'en';

    if (!organizationId) {
        await this.whatsAppService.sendMessage(senderPhoneNumber, isEn 
            ? "❌ You must be in an organization context." 
            : "❌ Vous devez être dans le contexte d'une organisation.");
        return;
    }

    const allEvents = await this.eventRepository.findByOrganizationId(organizationId);
    
    // Filter pertinent events (e.g., active or recently finished)
    // For now, let's show all upcoming events + maybe one recent?
    // Let's just show UPCOMING events.
    const now = new Date();
    const upcomingEvents = allEvents.filter(e => e.date >= now).sort((a, b) => a.date.getTime() - b.date.getTime());

    if (upcomingEvents.length === 0) {
        await this.whatsAppService.sendMessage(senderPhoneNumber, isEn 
            ? "ℹ️ No upcoming events." 
            : "ℹ️ Aucun événement à venir.");
        return;
    }

    let response = isEn 
        ? "📊 *Stock Status* :\n\n" 
        : "📊 *État des Stocks* :\n\n";
    
    upcomingEvents.forEach(e => {
        const remaining = e.totalCapacity - e.soldCount;
        const percent = Math.round((e.soldCount / e.totalCapacity) * 100);
        
        // Progress bar simulation ?? 
        // 10 chars: [████░░░░░░]
        // Simple text for now.
        response += `📅 *${e.name}* (${e.date.toLocaleDateString()})\n`;
        response += `   🎟️ ${e.soldCount}/${e.totalCapacity} ${isEn ? 'sold' : 'vendus'} (${percent}%)\n`;
        response += `   ✅ *${remaining} ${isEn ? 'remaining' : 'places restantes'}*\n\n`;
    });

    await this.whatsAppService.sendMessage(senderPhoneNumber, response);
  }
}
