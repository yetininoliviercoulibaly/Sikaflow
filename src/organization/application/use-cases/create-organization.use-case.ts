import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Organization } from '../../domain/organization.entity';
import { OrganizationMember, UserRole } from '../../domain/organization-member.entity';
import { IOrganizationRepository, I_ORGANIZATION_REPOSITORY } from '../../domain/ports/organization.repository.interface';
import { IUserRepository, I_USER_REPOSITORY } from '../../../user/domain/ports/user.repository.interface';

export interface CreateOrganizationCommand {
  ownerId: string;
  name: string;
}

@Injectable()
export class CreateOrganizationUseCase {
  constructor(
    @Inject(I_ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: IOrganizationRepository,
    @Inject(I_USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(command: CreateOrganizationCommand): Promise<Organization> {
    const { ownerId, name } = command;

    const user = await this.userRepository.findById(ownerId);
    if (!user) {
      throw new Error('User not found');
    }

    const organizationId = uuidv4();
    const newOrganization = new Organization(
      organizationId,
      name,
      ownerId,
      {},
      new Date(),
    );

    // Create Organization
    await this.organizationRepository.create(newOrganization);

    // Add Owner as Member
    const member = new OrganizationMember(
      organizationId,
      ownerId,
      UserRole.OWNER,
      new Date(),
    );
    await this.organizationRepository.addMember(member);

    // Update User's last active organization
    user.lastActiveOrganizationId = organizationId;
    await this.userRepository.update(user);

    return newOrganization;
  }
}
