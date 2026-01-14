import { Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { IOrganizationRepository, I_ORGANIZATION_REPOSITORY } from '../../domain/ports/organization.repository.interface';
import { IUserRepository, I_USER_REPOSITORY } from '../../../user/domain/ports/user.repository.interface';
import { Organization } from '../../domain/organization.entity';

export interface SwitchOrganizationCommand {
  userId: string;
  targetOrganizationId?: string;
  targetOrganizationName?: string;
}

@Injectable()
export class SwitchOrganizationUseCase {
  constructor(
    @Inject(I_ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: IOrganizationRepository,
    @Inject(I_USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(command: SwitchOrganizationCommand): Promise<{ success: boolean; organization?: Organization; message: string }> {
    const { userId, targetOrganizationId, targetOrganizationName } = command;

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get all organizations the user is a member of
    const userOrgs = await this.organizationRepository.findOrganizationsForUser(userId);

    let targetOrg: Organization | undefined;

    if (targetOrganizationId) {
      targetOrg = userOrgs.find((o) => o.id === targetOrganizationId);
    } else if (targetOrganizationName) {
      // Fuzzy match or exact match on name
      const lowerName = targetOrganizationName.toLowerCase();
      targetOrg = userOrgs.find((o) => o.name.toLowerCase().includes(lowerName));
    }

    if (!targetOrg) {
        return { 
            success: false, 
            message: `Je n'ai pas trouvé l'organisation "${targetOrganizationName || targetOrganizationId}" dans votre liste.` 
        };
    }

    // Update User Context
    user.lastActiveOrganizationId = targetOrg.id;
    await this.userRepository.update(user);

    return { 
        success: true, 
        organization: targetOrg, 
        message: `Contexte changé : Vous êtes maintenant sur **${targetOrg.name}**.` 
    };
  }
}
