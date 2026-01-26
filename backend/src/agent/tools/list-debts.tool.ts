import { Injectable, Inject } from '@nestjs/common';
import { z } from 'zod';
import { BaseTool } from './base.tool';
import { IContactRepository, I_CONTACT_REPOSITORY } from '../../contact/domain/ports/contact.repository.interface';

@Injectable()
export class ListDebtsTool extends BaseTool<any> {
  name = 'list_debts';
  description = 'Lists all contacts who owe money to the user or organization.';
  
  schema = z.object({
    userId: z.string().describe('The ID of the user requesting the list.'),
    organizationId: z.string().optional().describe('The organization ID context.'),
  });

  constructor(
      @Inject(I_CONTACT_REPOSITORY) private readonly contactRepository: IContactRepository
  ) {
    super();
  }

  protected async _call(input: z.infer<typeof this.schema>): Promise<string> {
    return this.handleSafe(async () => {
        const contacts = await this.contactRepository.findWithPendingDebts(input.userId, input.organizationId);
        
        if (contacts.length === 0) {
            return "No pending debts found.";
        }

        const total = contacts.reduce((sum, c) => sum + Number(c.totalOwed), 0);
        const list = contacts.map(c => `- ${c.displayName}: ${c.totalOwed} (ID: #${c.shortId})`).join('\n');

        return `Pending Debts (Total: ${total}):\n${list}`;
    });
  }
}
