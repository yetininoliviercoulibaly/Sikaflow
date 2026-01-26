import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { BaseTool } from './base.tool';
import { ContactService } from '../../contact/application/services/contact.service';

@Injectable()
export class AddDebtTool extends BaseTool<any> {
  name = 'add_debt';
  description = 'Records that a contact owes money to the user (Debt).';
  
  schema = z.object({
    userId: z.string().describe('The ID of the user recording the debt.'),
    organizationId: z.string().optional().describe('The organization ID context.'),
    amount: z.number().describe('The amount owed.'),
    contactName: z.string().describe('Name of the person who owes the money.'),
    contactPhone: z.string().optional().describe('Phone number of the person.'),
    contactContext: z.string().optional().describe('Brief context about the debt.'),
    currency: z.string().optional().describe('Currency code (default is XOF).'),
  });

  constructor(private readonly contactService: ContactService) {
    super();
  }

  protected async _call(input: z.infer<typeof this.schema>): Promise<string> {
    return this.handleSafe(async () => {
        const contact = await this.contactService.addDebt(input.userId, input.organizationId, {
            amount: input.amount,
            contactName: input.contactName,
            contactPhone: input.contactPhone,
            contactContext: input.contactContext,
            currency: input.currency || 'XOF',
        });
        return `Recorded debt of ${input.amount} for ${contact.displayName}. Total owed: ${contact.totalOwed}.`;
    });
  }
}
