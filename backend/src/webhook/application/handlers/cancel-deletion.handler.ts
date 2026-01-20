import { Injectable } from '@nestjs/common';
import { IActionHandler, ActionContext } from './action-handler.interface';
import { LLMIntent } from '../../../common/llm/llm-types';

@Injectable()
export class CancelDeletionHandler implements IActionHandler {
    canHandle(intent: string): boolean {
        return intent === LLMIntent.CANCEL_DELETION;
    }

    async handle(data: any, context: ActionContext): Promise<void> {
        await context.messagingService.sendMessage(
            context.senderPhoneNumber,
            "✅ Suppression annulée. Votre transaction est conservée."
        );
    }
}
