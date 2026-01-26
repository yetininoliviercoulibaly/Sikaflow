import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { BaseTool } from './base.tool';
import { UpdateCategoryUseCase } from '../../ticketing/application/use-cases/update-category.use-case';

@Injectable()
export class UpdateCategoryTool extends BaseTool<any> {
  name = 'update_ticket_category';
  description = 'Updates an existing ticket category (price, capacity, etc.).';
  
  schema = z.object({
    categoryId: z.string().describe('The ID of the category to update.'),
    name: z.string().optional().describe('New name for the category.'),
    price: z.number().optional().describe('New price.'),
    capacity: z.number().optional().describe('New capacity.'),
    description: z.string().optional().describe('New description.'),
    organizationId: z.string().describe('The ID of the organization.'),
    userRole: z.string().optional().describe('The role of the user updating the category.'),
  });

  constructor(private readonly updateCategoryUseCase: UpdateCategoryUseCase) {
    super();
  }

  protected async _call(input: z.infer<typeof this.schema>): Promise<string> {
    return this.handleSafe(async () => {
        await this.updateCategoryUseCase.execute(input.categoryId, input, input.organizationId, input.userRole as any);
        return `Category ${input.categoryId} updated successfully.`;
    });
  }
}
