import { Injectable } from '@nestjs/common';
import { IActionHandler, ActionContext } from './action-handler.interface';

@Injectable()
export class UnknownIntentHandler implements IActionHandler {
    canHandle(intent: string): boolean {
        return intent === 'UNKNOWN';
    }

    async handle(_data: Record<string, unknown>, context: ActionContext): Promise<void> {
        await context.messagingService.sendMessage(
            context.senderPhoneNumber,
            "Je n'ai pas compris votre demande. Tapez 'Aide' pour voir les options disponibles."
        );
    }
}
