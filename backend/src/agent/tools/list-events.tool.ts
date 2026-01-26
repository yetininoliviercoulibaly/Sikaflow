import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { BaseTool } from './base.tool';
import { ListEventsUseCase } from '../../ticketing/application/use-cases/list-events.use-case';

@Injectable()
export class ListEventsTool extends BaseTool<any> {
  name = 'list_events';
  description = 'Lists all events (upcoming and past) for the organization.';
  
  schema = z.object({
    organizationId: z.string().describe('The ID of the organization to list events for.'),
  });

  constructor(private readonly listEventsUseCase: ListEventsUseCase) {
    super();
  }

  protected async _call(input: z.infer<typeof this.schema>): Promise<string> {
    return this.handleSafe(async () => {
        const events = await this.listEventsUseCase.execute(input.organizationId);
        
        if (events.length === 0) {
            return "No events found for this organization.";
        }

        const report = events.map(e => {
            return `- ${e.name} (${e.date.toLocaleDateString()})`;
        }).join('\n');

        return `Events List:\n${report}`;
    });
  }
}
