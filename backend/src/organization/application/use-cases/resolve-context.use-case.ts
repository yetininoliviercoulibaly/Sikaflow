import { Inject, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Organization } from '../../domain/organization.entity';
import { IOrganizationRepository, I_ORGANIZATION_REPOSITORY } from '../../domain/ports/organization.repository.interface';
import { IUserRepository, I_USER_REPOSITORY } from '../../../user/domain/ports/user.repository.interface';

export interface ResolveContextCommand {
  phoneNumber: string;
}

@Injectable()
export class ResolveContextUseCase {
  private readonly logger = new Logger(ResolveContextUseCase.name);

  constructor(
    @Inject(I_ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: IOrganizationRepository,
    @Inject(I_USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(command: ResolveContextCommand): Promise<Organization> {
    const { phoneNumber } = command;

    // 1. Find User
    const user = await this.userRepository.findByIdentifier(phoneNumber);
    if (!user) {
      this.logger.warn(`Security Risk: Unknown phone number attempted access: ${phoneNumber}`);
      throw new NotFoundException(`User with phone ${phoneNumber} not found`);
    }

    // 2. Check Last Active Organization
    if (user.lastActiveOrganizationId) {
      const lastOrg = await this.organizationRepository.findById(user.lastActiveOrganizationId);
      const member = await this.organizationRepository.findMember(user.lastActiveOrganizationId, user.id);
      
      if (lastOrg && member) {
        return lastOrg;
      } else {
         this.logger.warn(`User ${user.id} tried to access cached Organization ${user.lastActiveOrganizationId} but is no longer a member.`);
         // Fallback to finding another org
      }
    }

    // 3. Fallback: Find any organization the user belongs to
    const organizations = await this.organizationRepository.findOrganizationsForUser(user.id);
    if (organizations.length === 0) {
        this.logger.warn(`User ${user.id} (${phoneNumber}) has no organization associations.`);
        throw new NotFoundException(`User ${phoneNumber} belongs to no organizations`);
    }

    // 4. Update Last Active (Context Switching)
    const selectedOrg = organizations[0];
    if (user.lastActiveOrganizationId !== selectedOrg.id) {
        user.lastActiveOrganizationId = selectedOrg.id;
        await this.userRepository.update(user);
    }

    return selectedOrg;
  }
}
