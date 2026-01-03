import { Inject, Injectable, UnauthorizedException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { IOrganizationRepository, I_ORGANIZATION_REPOSITORY } from '../../domain/ports/organization.repository.interface';
import { IUserRepository, I_USER_REPOSITORY } from '../../../user/domain/ports/user.repository.interface';
import { UserRole } from '../../domain/organization-member.entity';

export interface RemoveMemberCommand {
  requesterId: string;
  organizationId: string;
  targetUserId: string;
}

@Injectable()
export class RemoveMemberUseCase {
  constructor(
    @Inject(I_ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: IOrganizationRepository,
    @Inject(I_USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(command: RemoveMemberCommand): Promise<void> {
    const { requesterId, organizationId, targetUserId } = command;

    // 1. Check Requester Membership
    const requesterMember = await this.organizationRepository.findMember(organizationId, requesterId);
    if (!requesterMember) {
      throw new UnauthorizedException('Requester is not a member of this organization');
    }

    // 2. Check Target Existence
    const targetMember = await this.organizationRepository.findMember(organizationId, targetUserId);
    if (!targetMember) {
        throw new NotFoundException('Target user is not a member of this organization');
    }

    // 3. Permission Checks
    const isSelf = requesterId === targetUserId;

    if (isSelf) {
        // Case: Member (Self) Leaving
        if (targetMember.role === UserRole.OWNER) {
            throw new ForbiddenException('Owners cannot leave their organization. Transfer ownership or delete the organization.');
        }
    } else {
        // Case: Revocation (Requester removing someone else)
        // Strict Rule: Only OWNER can revoke members (per plan)
        if (requesterMember.role !== UserRole.OWNER) {
            throw new ForbiddenException('Only Owners can revoke members.');
        }
        
        // Safety: Cannot revoke another Owner (in case of multiple owners feature later, though currently 1)
        if (targetMember.role === UserRole.OWNER) {
            throw new ForbiddenException('Cannot revoke an Owner.');
        }
    }

    // 4. Remove Logic
    await this.organizationRepository.removeMember(organizationId, targetUserId);

    // 5. Update Target User State (Last Active Context)
    const targetUser = await this.userRepository.findById(targetUserId);
    if (targetUser && targetUser.lastActiveOrganizationId === organizationId) {
        targetUser.lastActiveOrganizationId = null; // Or logic to pick another one? For now, resets to null.
        await this.userRepository.update(targetUser);
    }
  }
}
