import { Injectable } from '@nestjs/common';
import { IActionHandler, ActionContext } from './action-handler.interface';

@Injectable()
export class NotImplementedHandler implements IActionHandler {
    constructor() {}

    canHandle(intent: string): boolean {
        return ['CANCEL_LAST_ACTION', 'UPDATE_LAST_ACTION'].includes(intent);
    }

    async handle(data: any, context: ActionContext): Promise<void> {
        await context.messagingService.sendMessage(
            context.senderPhoneNumber,
            "Désolé, cette fonctionnalité n'est pas encore disponible.",
        );
    }
}
