import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { BaseTool } from './base.tool';
import { CreateOrganizationUseCase } from '../../organization/application/use-cases/create-organization.use-case';

@Injectable()
export class CreateOrganizationTool extends BaseTool<any> {
  name = 'create_organization';
  description = 'Creates a new organization and sets the user as the owner.';
  
  schema = z.object({
    ownerId: z.string().optional().describe('The ID of the owner user.'),
    name: z.string().describe('The name of the organization.'),
    userPhoneNumber: z.string().optional().describe('Phone number of the owner (if user not found by ID).'),
    currency: z.string().optional().describe('Currency code (e.g., XOF, EUR). Default is XOF.'),
  });

  constructor(private readonly createOrganizationUseCase: CreateOrganizationUseCase) {
    super();
  }

  protected async _call(input: z.infer<typeof this.schema>): Promise<string> {
    return this.handleSafe(async () => {
        const org = await this.createOrganizationUseCase.execute(input);
        return `Organization "${org.name}" has been created successfully (ID: ${org.id}).`;
    });
  }
}
