import { Injectable } from '@nestjs/common';
import { IActionHandler, ActionContext } from './action-handler.interface';
import { LLMIntent } from '../../../common/llm/llm-types';

@Injectable()
export class NotImplementedHandler implements IActionHandler {
    constructor() {}

    canHandle(intent: string): boolean {
        return [LLMIntent.UPDATE_LAST_ACTION].includes(intent as LLMIntent);
    }

    async handle(data: any, context: ActionContext): Promise<void> {
        await context.messagingService.sendMessage(
            context.senderPhoneNumber,
            "Désolé, cette fonctionnalité n'est pas encore disponible.",
        );
    }
}
