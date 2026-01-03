import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Organization } from '../../domain/organization.entity';
import { OrganizationMember, UserRole } from '../../domain/organization-member.entity';
import { IOrganizationRepository, I_ORGANIZATION_REPOSITORY } from '../../domain/ports/organization.repository.interface';
import { IUserRepository, I_USER_REPOSITORY } from '../../../user/domain/ports/user.repository.interface';
import { User } from '../../../user/domain/user.entity';

export interface CreateOrganizationCommand {
  ownerId?: string;
  name: string;
  userPhoneNumber?: string;
}

@Injectable()
export class CreateOrganizationUseCase {
  constructor(
    @Inject(I_ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: IOrganizationRepository,
    @Inject(I_USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(command: { ownerId?: string; name: string; userPhoneNumber?: string }): Promise<Organization> {
    const { ownerId, name, userPhoneNumber } = command;
    let userId = ownerId;
    let user = userId ? await this.userRepository.findById(userId) : null;

    // If user not found by ID, try to find by phone number if provided
    if (!user && userPhoneNumber) {
        user = await this.userRepository.findByPhoneNumber(userPhoneNumber);
    }

    // If still not found and we have a phone number, CREATE the user
    if (!user && userPhoneNumber) {
        userId = uuidv4();
        const newUser = new User(
            userId,
            userPhoneNumber,
            null, // Name unknown initially
            null, // No org yet
            new Date()
        );
        user = await this.userRepository.create(newUser);
    }

    if (!user) {
      throw new Error('User not found and no phone number provided to create one.');
    }
    
    userId = user.id;

    const organizationId = uuidv4();
    const newOrganization = new Organization(
      organizationId,
      name,
      userId,
      {},
      new Date(),
    );

    // Create Organization
    await this.organizationRepository.create(newOrganization);

    // Add Owner as Member
    const member = new OrganizationMember(
      organizationId,
      userId,
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
