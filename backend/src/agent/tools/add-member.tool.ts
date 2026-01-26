import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { BaseTool } from './base.tool';
import { AddMemberUseCase } from '../../organization/application/use-cases/add-member.use-case';
import { UserRole } from '../../organization/domain/organization-member.entity';

@Injectable()
export class AddMemberTool extends BaseTool<any> {
  name = 'add_member';
  description = 'Adds a new member to an organization with a specific role (OWNER, MANAGER, STAFF).';
  
  schema = z.object({
    requesterId: z.string().describe('The ID of the user requesting to add a member (must be owner/manager).'),
    organizationId: z.string().describe('The ID of the organization.'),
    targetPhoneNumber: z.string().describe('Phone number of the person to add.'),
    role: z.nativeEnum(UserRole).describe('The role to assign.'),
  });

  constructor(private readonly addMemberUseCase: AddMemberUseCase) {
    super();
  }

  protected async _call(input: z.infer<typeof this.schema>): Promise<string> {
    return this.handleSafe(async () => {
        await this.addMemberUseCase.execute(input);
        return `Successfully added user with phone ${input.targetPhoneNumber} to the organization as ${input.role}.`;
    });
  }
}
