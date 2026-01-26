import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { BaseTool } from './base.tool';
import { DeleteCategoryUseCase } from '../../ticketing/application/use-cases/delete-category.use-case';

@Injectable()
export class DeleteCategoryTool extends BaseTool<any> {
  name = 'delete_ticket_category';
  description = 'Deletes a ticket category from an event.';
  
  schema = z.object({
    categoryId: z.string().describe('The ID of the category to delete.'),
    organizationId: z.string().describe('The ID of the organization.'),
    userRole: z.string().optional().describe('The role of the user deleting the category.'),
  });

  constructor(private readonly deleteCategoryUseCase: DeleteCategoryUseCase) {
    super();
  }

  protected async _call(input: z.infer<typeof this.schema>): Promise<string> {
    return this.handleSafe(async () => {
        await this.deleteCategoryUseCase.execute(input.categoryId, input.organizationId, input.userRole as any);
        return `Category ${input.categoryId} has been deleted.`;
    });
  }
}
