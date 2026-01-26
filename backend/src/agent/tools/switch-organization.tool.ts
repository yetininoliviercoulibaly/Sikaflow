import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { BaseTool } from './base.tool';
import { SwitchOrganizationUseCase } from '../../organization/application/use-cases/switch-organization.use-case';

@Injectable()
export class SwitchOrganizationTool extends BaseTool<any> {
  name = 'switch_organization';
  description = 'Switches the current active organization context for the user.';
  
  schema = z.object({
    userId: z.string().describe('The ID of the user switching contexts.'),
    targetOrganizationId: z.string().optional().describe('The ID of the target organization.'),
    targetOrganizationName: z.string().optional().describe('The name of the target organization (for fuzzy matching).'),
  });

  constructor(private readonly switchOrganizationUseCase: SwitchOrganizationUseCase) {
    super();
  }

  protected async _call(input: z.infer<typeof this.schema>): Promise<string> {
    return this.handleSafe(async () => {
        const result = await this.switchOrganizationUseCase.execute(input);
        return result.message;
    });
  }
}
