import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { BaseTool } from './base.tool';
import { ContactService } from '../../contact/application/services/contact.service';

@Injectable()
export class SettleDebtTool extends BaseTool<any> {
  name = 'settle_debt';
  description = 'Records a payment from a contact to settle their debt.';
  
  schema = z.object({
    userId: z.string().describe('The ID of the user receiving payment.'),
    organizationId: z.string().optional().describe('The organization ID context.'),
    amount: z.number().optional().describe('The amount paid. If omitted, settles the full debt.'),
    contactName: z.string().optional().describe('Name of the contact.'),
    contactShortId: z.string().optional().describe('Short ID (#XXXX) of the contact.'),
  });

  constructor(private readonly contactService: ContactService) {
    super();
  }

  protected async _call(input: z.infer<typeof this.schema>): Promise<string> {
    return this.handleSafe(async () => {
        const result = await this.contactService.settleDebt(input.userId, input.organizationId, {
            amount: input.amount,
            contactName: input.contactName,
            contactShortId: input.contactShortId,
        });
        if (!result) return "Contact not found.";
        const status = result.contact.totalOwed === 0 ? "Debt fully settled." : `Remaining debt: ${result.contact.totalOwed}.`;
        return `Recorded payment of ${result.settledAmount} from ${result.contact.displayName}. ${status}`;
    });
  }
}
