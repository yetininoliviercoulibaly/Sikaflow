import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { BaseTool } from './base.tool';
import { ListEventsUseCase } from '../../ticketing/application/use-cases/list-events.use-case';

@Injectable()
export class CheckStockTool extends BaseTool<any> {
  name = 'check_stock';
  description = 'Checks the ticket stock/availability for all upcoming events of the organization.';
  
  schema = z.object({
    organizationId: z.string().describe('The ID of the organization to check stock for.'),
  });

  constructor(private readonly listEventsUseCase: ListEventsUseCase) {
    super();
  }

  protected async _call(input: z.infer<typeof this.schema>): Promise<string> {
    return this.handleSafe(async () => {
        const events = await this.listEventsUseCase.execute(input.organizationId);
        
        const now = new Date();
        const upcoming = events
            .filter(e => e.date >= now)
            .sort((a, b) => a.date.getTime() - b.date.getTime());

        if (upcoming.length === 0) {
            return "No upcoming events found.";
        }

        const report = upcoming.map(e => {
            const sold = e.soldCount;
            const total = e.totalCapacity;
            const remaining = total - sold;
            const percent = Math.round((sold / total) * 100);
            return `- ${e.name} (${e.date.toLocaleDateString()}): ${sold}/${total} sold (${percent}%), ${remaining} remaining.`;
        }).join('\n');

        return `Stock Status:\n${report}`;
    });
  }
}
