import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { BaseTool } from './base.tool';
import { ListCategoriesUseCase } from '../../ticketing/application/use-cases/list-categories.use-case';

@Injectable()
export class ListCategoriesTool extends BaseTool<any> {
  name = 'list_ticket_categories';
  description = 'Lists all ticket categories available for a specific event.';
  
  schema = z.object({
    eventId: z.string().describe('The ID of the event.'),
    organizationId: z.string().describe('The ID of the organization.'),
    userRole: z.string().optional().describe('The role of the user listing the categories.'),
  });

  constructor(private readonly listCategoriesUseCase: ListCategoriesUseCase) {
    super();
  }

  protected async _call(input: z.infer<typeof this.schema>): Promise<string> {
    return this.handleSafe(async () => {
        const categories = await this.listCategoriesUseCase.execute(input.eventId, input.organizationId, input.userRole as any);
        if (categories.length === 0) return "No categories found for this event.";
        
        const list = categories.map(c => `- ${c.name}: ${c.price} (${c.soldCount}/${c.capacity} sold)`).join('\n');
        return `Ticket Categories for event ${input.eventId}:\n${list}`;
    });
  }
}
