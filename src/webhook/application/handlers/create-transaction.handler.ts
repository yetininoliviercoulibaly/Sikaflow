import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IActionHandler, ActionContext } from './action-handler.interface';
import { CreateTransactionUseCase } from '../../../transaction/application/use-cases/create-transaction.use-case';
import { TransactionType } from '../../../transaction/domain/transaction.entity';
import { WhatsAppService } from '../../../common/whatsapp/whatsapp.service';
import { IUserRepository } from '../../../user/domain/ports/user.repository.interface';

@Injectable()
export class CreateTransactionHandler implements IActionHandler {
    constructor(
        private readonly createTransactionUseCase: CreateTransactionUseCase,
        private readonly whatsAppService: WhatsAppService,
        private readonly eventEmitter: EventEmitter2,
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


        const result = await this.createTransactionUseCase.execute({
            phoneNumber: context.senderPhoneNumber,
            amount: data.amount,
            category: data.category || 'Uncategorized',
            description: data.description || 'Transaction',
            type: data.type === 'INCOME' ? TransactionType.INCOME : TransactionType.EXPENSE,
            originMessageId: context.messageId
        });

        // Emit Event for Onboarding
        // We need userId, but context only has phoneNumber. 
        // Assuming CreateTransactionUseCase returns transaction or user, OR we fetch user.
        // Since we don't have direct access to user here easily (UseCase abstracts it),
        // we might do a best effort or rely on UseCase returning the user.
        // Actually, context usually has userId if we enriched it? No, context is ActionContext { senderPhoneNumber, organizationId, messageId }
        
        // For accurate event emission, we should fetch the user ID if not available.
        // But for simplicity/performance, if we can't emit userId, maybe emit phoneNumber?
        // The OnboardingEventListener listens to: payload: { userId: string; ... } using userId to find OnboardingProgress.
        
        // Let's defer fetching user to the handler logic or inside UseCase.
        // However, I can't easily change UseCase right now.
        // Does CreateTransactionUseCase return anything? It returns `Promise<Transaction>`.

        // Transaction has `reportedByUserId`
        if (result && result.reportedByUserId) {
             this.eventEmitter.emit('transaction.created', {
                userId: result.reportedByUserId,
                organizationId: context.organizationId,
                senderPhoneNumber: context.senderPhoneNumber
            });
        }
    }
}
