
import { Injectable } from '@nestjs/common';
import { IActionHandler, ActionContext } from './action-handler.interface';
import { CreateEventUseCase } from '../../../ticketing/application/use-cases/create-event.use-case';
import { LLMIntent } from '../../../common/llm/llm-types';

@Injectable()
export class CreateEventHandler implements IActionHandler {
  constructor(
    private readonly createEventUseCase: CreateEventUseCase,
  ) {}

  canHandle(intent: string): boolean {
    return intent === LLMIntent.CREATE_EVENT;
  }

  async handle(data: any, context: ActionContext): Promise<void> {
    const { senderPhoneNumber, organizationId, messagingService } = context;
    const { event_name, date, capacity, price } = data;

    if (!organizationId) {
        await messagingService.sendMessage(senderPhoneNumber, '❌ Aucune organisation sélectionnée.');
        return;
    }

    if (!event_name || !date || !capacity || !price) {
        await messagingService.sendMessage(senderPhoneNumber, '❌ Informations manquantes. Format: "Crée l\'événement [Nom] le [Date] avec [Capacité] places à [Prix] FCFA"');
        return;
    }

    try {
        const event = await this.createEventUseCase.execute(organizationId, event_name, date, parseInt(capacity), parseInt(price));
        const message = `✅ Événement '${event.name}' créé avec succès !\n📅 Date : ${event.date.toLocaleDateString()}\n🎟️ Places : ${event.totalCapacity}\n💰 Prix : ${event.price} FCFA`;
        await messagingService.sendMessage(senderPhoneNumber, message);
    } catch (e) {
        await messagingService.sendMessage(senderPhoneNumber, `❌ Erreur lors de la création: ${e.message}`);
    }
  }
}
