import { Injectable } from '@nestjs/common';
import { IActionHandler, ActionContext } from './action-handler.interface';
import { CreateTransactionUseCase } from '../../../transaction/application/use-cases/create-transaction.use-case';
import { TransactionType } from '../../../transaction/domain/transaction.entity';

import { WhatsAppService } from '../../../common/whatsapp/whatsapp.service';

@Injectable()
export class CreateTransactionHandler implements IActionHandler {
    constructor(
        private readonly createTransactionUseCase: CreateTransactionUseCase,
        private readonly whatsAppService: WhatsAppService
    ) {}

    canHandle(intent: string): boolean {
        return intent === 'CREATE_TRANSACTION';
    }

    async handle(data: any, context: ActionContext): Promise<void> {
        // Confidence Check
        const threshold = parseFloat(process.env.AI_CONFIDENCE_THRESHOLD || '0.85');
        const confidence = data.confidence;
        
        if (typeof confidence === 'number' && confidence < threshold) {
             const amount = data.amount;
             const type = data.type;
             const category = data.category || 'Uncategorized';
             const currency = data.currency || 'EUR';
             
             // Encode essential data in payload (Max ~200 chars safe)
             // Format: CONFIRM_TX|Amount|Currency|Type|Category
             const payload = `CONFIRM_TX|${amount}|${currency}|${type}|${category}`;
             
             await this.whatsAppService.sendInteractiveButtons(
                 context.senderPhoneNumber,
                 `⚠️ J'ai un doute sur la lecture (Confiance: ${(confidence * 100).toFixed(0)}%).\n\nJ'ai lu : *${amount} ${currency}* (${category}).\nEst-ce correct ?`,
                 [
                     { id: payload, title: "✅ Oui, confirmer" },
                     { id: "REJECT_TX", title: "❌ Non, corriger" }
                 ]
             );
             return;
        }

        await this.createTransactionUseCase.execute({
            phoneNumber: context.senderPhoneNumber,
            amount: data.amount,
            category: data.category || 'Uncategorized',
            description: data.description || 'Transaction',
            type: data.type === 'INCOME' ? TransactionType.INCOME : TransactionType.EXPENSE,
            originMessageId: context.messageId
        });
    }
}
