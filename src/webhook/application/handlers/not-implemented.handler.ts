import { Injectable } from '@nestjs/common';
import { IActionHandler, ActionContext } from './action-handler.interface';
import { WhatsAppService } from '../../../common/whatsapp/whatsapp.service';

@Injectable()
export class NotImplementedHandler implements IActionHandler {
    constructor(private readonly whatsAppService: WhatsAppService) {}

    canHandle(intent: string): boolean {
        return ['CANCEL_LAST_ACTION', 'UPDATE_LAST_ACTION'].includes(intent);
    }

    async handle(data: any, context: ActionContext): Promise<void> {
         await this.whatsAppService.sendMessage(context.senderPhoneNumber, "Désolé, cette fonctionnalité n'est pas encore disponible.");
    }
}
