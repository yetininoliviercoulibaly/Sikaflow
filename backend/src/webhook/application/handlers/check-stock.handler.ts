
import { Injectable, Inject } from '@nestjs/common';
import { IActionHandler, ActionContext } from './action-handler.interface';
import { IEventRepository, I_EVENT_REPOSITORY } from '../../../ticketing/domain/ports/event.repository.interface';
import { CheckFeatureUseCase } from '../../../subscription/application/use-cases/check-feature.use-case';
import { FeatureFlag } from '../../../subscription/domain/feature-flag.enum';
import { LLMIntent } from '../../../common/llm/llm-types';

@Injectable()
export class CheckStockHandler implements IActionHandler {
  constructor(
    @Inject(I_EVENT_REPOSITORY) private readonly eventRepository: IEventRepository,
    private readonly checkFeatureUseCase: CheckFeatureUseCase,
  ) {}

  canHandle(intent: string): boolean {
    return intent === LLMIntent.CHECK_STOCK;
  }

  async handle(data: any, context: ActionContext): Promise<void> {
    const { senderPhoneNumber, organizationId, messagingService } = context;

    const isEn = context.language === 'en';

    if (!organizationId) {
        await messagingService.sendMessage(senderPhoneNumber, isEn 
            ? "❌ You must be in an organization context." 
            : "❌ Vous devez être dans le contexte d'une organisation.");
        return;
    }

    const { hasAccess } = await this.checkFeatureUseCase.execute({
        organizationId,
        feature: FeatureFlag.STOCK_MANAGEMENT
    });

    if (!hasAccess) {
        await messagingService.sendMessage(senderPhoneNumber, isEn 
            ? "🔒 Feature not available in your plan." 
            : "🔒 Fonctionnalité non incluse dans votre abonnement.");
        return;
    }

    const allEvents = await this.eventRepository.findByOrganizationId(organizationId);
    
    const now = new Date();
    const upcomingEvents = allEvents.filter(e => e.date >= now).sort((a, b) => a.date.getTime() - b.date.getTime());

    if (upcomingEvents.length === 0) {
        await messagingService.sendMessage(senderPhoneNumber, isEn 
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
        
        response += `📅 *${e.name}* (${e.date.toLocaleDateString()})\n`;
        response += `   🎟️ ${e.soldCount}/${e.totalCapacity} ${isEn ? 'sold' : 'vendus'} (${percent}%)\n`;
        response += `   ✅ *${remaining} ${isEn ? 'remaining' : 'places restantes'}*\n\n`;
    });

    await messagingService.sendMessage(senderPhoneNumber, response);
  }
}
