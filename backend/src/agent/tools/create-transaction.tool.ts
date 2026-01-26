import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { BaseTool } from './base.tool';
import { CreateTransactionUseCase } from '../../transaction/application/use-cases/create-transaction.use-case';
import { TransactionType } from '../../transaction/domain/transaction.entity';

@Injectable()
export class CreateTransactionTool extends BaseTool<any> {
  name = 'create_transaction';
  description = 'Records a new financial transaction (expense or income) for the organization.';
  
  schema = z.object({
    amount: z.number().describe('The numeric amount of the transaction.'),
    currency: z.string().describe('The currency code (e.g. XOF, EUR).'),
    type: z.enum(['INCOME', 'EXPENSE']).describe('Type of transaction.'),
    category: z.string().describe('Category of the transaction (e.g. Food, Transport, Salary).'),
    description: z.string().optional().describe('Optional description or note.'),
    phoneNumber: z.string().describe('The phone number of the user creating the transaction.'),
  });

  constructor(private readonly createTransactionUseCase: CreateTransactionUseCase) {
    super();
  }

  protected async _call(input: z.infer<typeof this.schema>): Promise<string> {
    return this.handleSafe(async () => {
        const result = await this.createTransactionUseCase.execute({
            phoneNumber: input.phoneNumber,
            amount: input.amount,
            // TODO: Currency handling is missing in UseCase DTO, assuming default or need update
            type: input.type === 'INCOME' ? TransactionType.INCOME : TransactionType.EXPENSE,
            category: input.category,
            description: input.description || 'Transaction from Agent',
            originMessageId: 'AGENT_GENERATED' // Placeholder
        });

        return JSON.stringify({
            status: 'success',
            transactionId: result.id,
            message: `Transaction ${input.type} of ${input.amount} recorded.`
        });
    });
  }
}
