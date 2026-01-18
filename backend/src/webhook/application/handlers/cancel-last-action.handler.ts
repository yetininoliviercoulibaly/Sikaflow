import { Injectable, Logger } from '@nestjs/common';
import { IActionHandler, ActionContext } from './action-handler.interface';
import { LLMIntent } from '../../../common/llm/llm-types';
import { GetLastTransactionUseCase } from '../../../transaction/application/use-cases/get-last-transaction.use-case';

@Injectable()
export class CancelLastActionHandler implements IActionHandler {
    private readonly logger = new Logger(CancelLastActionHandler.name);

    constructor(
        private readonly getLastTransactionUseCase: GetLastTransactionUseCase,
    ) {}

    canHandle(intent: string): boolean {
        return intent === LLMIntent.CANCEL_LAST_ACTION;
    }

    async handle(data: any, context: ActionContext): Promise<void> {
        const { senderPhoneNumber, messagingService } = context;

        try {
            // 1. Fetch Last Transaction
            const transaction = await this.getLastTransactionUseCase.execute({ phoneNumber: senderPhoneNumber });

            if (!transaction) {
                await messagingService.sendMessage(senderPhoneNumber, "🚫 Aucune transaction récente trouvée pour vous.");
                return;
            }

            // 2. Format Date and Amount
            const dateStr = new Date(transaction.transactionDate).toLocaleDateString('fr-FR');
            const amountStr = `${transaction.amount} ${transaction.currency}`;
            const categoryStr = transaction.category || 'Non catégorisé';

            // 3. Prepare Confirmation Message
            const message = `⚠️ *Confirmation de suppression*\n\nJe vais supprimer cette transaction :\n\n📅 *Date :* ${dateStr}\n💰 *Montant :* ${amountStr}\n🏷️ *Catégorie :* ${categoryStr}\n\nÊtes-vous sûr ?`;

            // 4. Send Buttons
            await messagingService.sendInteractiveButtons(
                senderPhoneNumber,
                message,
                [
                    { id: `CONFIRM_DEL|YES|${transaction.id}`, title: '✅ OUI, Supprimer' },
                    { id: `CONFIRM_DEL|NO`, title: '❌ NON, Garder' },
                ]
            );

        } catch (error) {
            this.logger.error(`Error in CancelLastActionHandler: ${error.message}`, error);
            await messagingService.sendMessage(senderPhoneNumber, "❌ Une erreur s'est produite lors de la récupération de votre dernière action.");
        }
    }
}
