import { Injectable, Logger } from '@nestjs/common';
import { IActionHandler, ActionContext } from './action-handler.interface';
import { LLMIntent } from '../../../common/llm/llm-types';
import { DeleteTransactionUseCase } from '../../../transaction/application/use-cases/delete-transaction.use-case';

@Injectable()
export class ExecuteDeletionHandler implements IActionHandler {
    private readonly logger = new Logger(ExecuteDeletionHandler.name);

    constructor(
        private readonly deleteTransactionUseCase: DeleteTransactionUseCase,
    ) {}

    canHandle(intent: string): boolean {
        return intent === LLMIntent.EXECUTE_DELETION;
    }

    async handle(data: any, context: ActionContext): Promise<void> {
        const { senderPhoneNumber, messagingService } = context;
        const { transactionId } = data;

        if (!transactionId) {
             await messagingService.sendMessage(senderPhoneNumber, "❌ Erreur : ID de transaction manquant.");
             return;
        }

        try {
            await this.deleteTransactionUseCase.execute({ transactionId });
            await messagingService.sendMessage(senderPhoneNumber, "✅ Transaction supprimée avec succès.");
        } catch (error) {
            this.logger.error(`Error deleting transaction ${transactionId}: ${error.message}`, error);
            await messagingService.sendMessage(senderPhoneNumber, "❌ Une erreur est survenue lors de la suppression.");
        }
    }
}
