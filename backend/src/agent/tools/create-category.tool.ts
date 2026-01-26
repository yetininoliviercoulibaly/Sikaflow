import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { BaseTool } from './base.tool';
import { CreateCategoryUseCase } from '../../ticketing/application/use-cases/create-category.use-case';

@Injectable()
export class CreateCategoryTool extends BaseTool<any> {
  name = 'create_ticket_category';
  description = 'Creates a new ticket category for an event (e.g., VIP, Regular, Early Bird).';
  
  schema = z.object({
    eventId: z.string().describe('The ID of the event.'),
    name: z.string().describe('The name of the category.'),
    price: z.number().describe('The price of the ticket in this category.'),
    capacity: z.number().describe('The total capacity for this category.'),
    description: z.string().optional().describe('Brief description of the category.'),
    organizationId: z.string().describe('The ID of the organization.'),
    userRole: z.string().optional().describe('The role of the user creating the category.'),
  });

  constructor(private readonly createCategoryUseCase: CreateCategoryUseCase) {
    super();
  }

  protected async _call(input: z.infer<typeof this.schema>): Promise<string> {
    return this.handleSafe(async () => {
        const category = await this.createCategoryUseCase.execute(input.eventId, input, input.organizationId, input.userRole as any);
        return `Category "${category.name}" created successfully for event ${input.eventId} (Price: ${category.price}).`;
    });
  }
}
