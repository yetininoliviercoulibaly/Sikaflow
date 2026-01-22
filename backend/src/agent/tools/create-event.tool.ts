import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { BaseTool } from './base.tool';
import { CreateEventUseCase } from '../../ticketing/application/use-cases/create-event.use-case';

@Injectable()
export class CreateEventTool extends BaseTool<any> {
  name = 'create_event';
  description = 'Creates a new event with a name, date, capacity, and price.';
  
  schema = z.object({
    organizationId: z.string().describe('The ID of the organization creating the event.'),
    name: z.string().describe('Name of the event.'),
    date: z.string().describe('Date of the event (ISO string).'),
    capacity: z.number().describe('Total capacity of the event.'),
    price: z.number().describe('Standard ticket price.'),
  });

  constructor(private readonly createEventUseCase: CreateEventUseCase) {
    super();
  }

  protected async _call(input: z.infer<typeof this.schema>): Promise<string> {
    return this.handleSafe(async () => {
        const event = await this.createEventUseCase.execute(
            input.organizationId,
            input.name,
            input.date,
            input.capacity,
            input.price
        );

        return JSON.stringify({
            status: 'success',
            eventId: event.id,
            message: `Event "${event.name}" created for ${event.date} (Capacity: ${event.totalCapacity}).`
        });
    });
  }
}
