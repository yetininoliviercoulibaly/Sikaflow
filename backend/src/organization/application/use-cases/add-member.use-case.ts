import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { OrganizationMember, UserRole } from '../../domain/organization-member.entity';
import { IOrganizationRepository, I_ORGANIZATION_REPOSITORY } from '../../domain/ports/organization.repository.interface';
import { IUserRepository, I_USER_REPOSITORY } from '../../../user/domain/ports/user.repository.interface';
import { User } from '../../../user/domain/user.entity';

export interface AddMemberCommand {
  requesterId: string;
  organizationId: string;
  targetPhoneNumber: string;
  role: UserRole;
}

@Injectable()
export class AddMemberUseCase {
  constructor(
    @Inject(I_ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: IOrganizationRepository,
    @Inject(I_USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(command: AddMemberCommand): Promise<void> {
    const { requesterId, organizationId, targetPhoneNumber, role } = command;

    // 1. Verify Request
    const requesterMember = await this.organizationRepository.findMember(organizationId, requesterId);
    if (!requesterMember) {
      throw new UnauthorizedException('User is not a member of this organization');
    }

    if (requesterMember.role !== UserRole.OWNER && requesterMember.role !== UserRole.MANAGER) {
        // Only Owners and Managers can add members (adjust policy as needed)
      throw new UnauthorizedException('Insufficient permissions to add members');
    }

    // 2. Find or Create Target User
    let targetUser = await this.userRepository.findByPhoneNumber(targetPhoneNumber);
    if (!targetUser) {
      // Create Ghost User
      targetUser = new User(
        uuidv4(),
        targetPhoneNumber,
        null, // Name unknown yet
        null,
        new Date(),
      );
      await this.userRepository.create(targetUser);
    }

    // 3. Add to Organization
    const existingMember = await this.organizationRepository.findMember(organizationId, targetUser.id);
    if (existingMember) {
      throw new Error('User is already a member of this organization');
    }

    const newMember = new OrganizationMember(
        organizationId,
        targetUser.id,
        role,
        new Date()
    );

    await this.organizationRepository.addMember(newMember);
  }
}
