
import { Injectable, Inject } from '@nestjs/common';
import { IActionHandler } from './action-handler.interface';
import { CreateEventUseCase } from '../../../ticketing/application/use-cases/create-event.use-case';
import { IWhatsAppService, I_WHATSAPP_SERVICE } from '../../../common/whatsapp/whatsapp.service.interface';
import { LLMIntent } from '../../../common/llm/llm-types';

@Injectable()
export class CreateEventHandler implements IActionHandler {
  constructor(
    private readonly createEventUseCase: CreateEventUseCase,
    @Inject(I_WHATSAPP_SERVICE) private readonly whatsAppService: IWhatsAppService,
  ) {}

  canHandle(intent: string): boolean {
    return intent === LLMIntent.CREATE_EVENT;
  }

  async handle(data: any, context: any): Promise<void> {
    const { senderPhoneNumber, organizationId } = context;
    const { event_name, date, capacity, price } = data;

    if (!organizationId) {
        await this.whatsAppService.sendMessage(senderPhoneNumber, '❌ Aucune organisation sélectionnée.');
        return;
    }

    if (!event_name || !date || !capacity || !price) {
        await this.whatsAppService.sendMessage(senderPhoneNumber, '❌ Informations manquantes. Format: "Crée l\'événement [Nom] le [Date] avec [Capacité] places à [Prix] FCFA"');
        return;
    }

    try {
        const message = await this.createEventUseCase.execute(organizationId, event_name, date, parseInt(capacity), parseInt(price));
        await this.whatsAppService.sendMessage(senderPhoneNumber, message);
    } catch (e) {
        await this.whatsAppService.sendMessage(senderPhoneNumber, `❌ Erreur lors de la création: ${e.message}`);
    }
  }
}
