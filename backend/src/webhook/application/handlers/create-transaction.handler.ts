import { CategoryTranslator } from '../../../common/utils/category-translator';
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IActionHandler, ActionContext } from './action-handler.interface';
import { CreateTransactionUseCase } from '../../../transaction/application/use-cases/create-transaction.use-case';
import { TransactionType } from '../../../transaction/domain/transaction.entity';
import { LLMIntent } from '../../../common/llm/llm-types';

@Injectable()
export class CreateTransactionHandler implements IActionHandler {
    constructor(
        private readonly createTransactionUseCase: CreateTransactionUseCase,
        private readonly eventEmitter: EventEmitter2,
    ) {}

    canHandle(intent: string): boolean {
        return intent === LLMIntent.CREATE_TRANSACTION;
    }

    async handle(data: any, context: ActionContext): Promise<void> {
        const { senderPhoneNumber, messagingService, organizationId, messageId } = context;
        
        // Confidence Check
        const threshold = parseFloat(process.env.AI_CONFIDENCE_THRESHOLD || '0.85');
        const confidence = data.confidence;
        
        if (typeof confidence === 'number' && confidence < threshold) {
             const amount = data.amount;
             const type = data.type;
             const category = data.category || 'Uncategorized';
             const detectedCurrency = data.currency || getCurrency();
             
             // Encode essential data in payload (Max ~200 chars safe)
             // Format: CONFIRM_TX|Amount|Currency|Type|Category
             const payload = `CONFIRM_TX|${amount}|${detectedCurrency}|${type}|${category}`;
             
             // Localize for display
             const localizedCategory = CategoryTranslator.translate(category);

             await messagingService.sendInteractiveButtons(
                 senderPhoneNumber,
                 `⚠️ J'ai un doute sur la lecture (Confiance: ${(confidence * 100).toFixed(0)}%).\n\nJ'ai lu : *${amount} ${detectedCurrency}* (${localizedCategory}).\nEst-ce correct ?`,
                 [
                     { id: payload, title: "✅ Oui, confirmer" },
                     { id: "REJECT_TX", title: "❌ Non, corriger" }
                 ]
             );
             return;
        }


        const result = await this.createTransactionUseCase.execute({
            phoneNumber: senderPhoneNumber,
            amount: data.amount,
            category: data.category || 'Uncategorized',
            description: data.description || 'Transaction',
            type: data.type === 'INCOME' ? TransactionType.INCOME : TransactionType.EXPENSE,
            originMessageId: messageId
        });

        // Send confirmation message
        const typeLabel = CategoryTranslator.translate(data.type);
        const confirmedCurrency = data.currency || getCurrency();
        const categoryLabel = CategoryTranslator.translate(data.category);

        await messagingService.sendMessage(
            senderPhoneNumber,
            `✅ *${typeLabel} enregistré !*\n\n💰 Montant : *${data.amount} ${confirmedCurrency}*\n📁 Catégorie : ${categoryLabel}`
        );

        // Emit Event for Onboarding
        if (result && result.reportedByUserId) {
             this.eventEmitter.emit('transaction.created', {
                userId: result.reportedByUserId,
                organizationId: organizationId,
                senderPhoneNumber: senderPhoneNumber,
                platform: context.platform
            });
        }
    }
}
