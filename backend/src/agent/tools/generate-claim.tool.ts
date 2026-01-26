import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { BaseTool } from './base.tool';
import { GenerateClaimLinkUseCase } from '../../ticketing/application/use-cases/generate-claim-link.use-case';

@Injectable()
export class GenerateClaimTool extends BaseTool<any> {
  name = 'generate_claim';
  description = 'Generates one or more claim tokens for an event, allowing others to claim tickets later.';
  
  schema = z.object({
    eventId: z.string().describe('The ID of the event.'),
    organizationId: z.string().describe('The ID of the organization.'),
    quantity: z.number().describe('Number of tokens to generate.'),
  });

  constructor(private readonly generateClaimUseCase: GenerateClaimLinkUseCase) {
    super();
  }

  protected async _call(input: z.infer<typeof this.schema>): Promise<string> {
    return this.handleSafe(async () => {
        const claims = await this.generateClaimUseCase.execute(input.eventId, input.organizationId, input.quantity);
        const tokens = claims.map(c => c.token).join(', ');
        return `Successfully generated ${claims.length} claim tokens: ${tokens}`;
    });
  }
}
