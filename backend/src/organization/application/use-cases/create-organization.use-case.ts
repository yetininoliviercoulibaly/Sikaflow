import { Inject, Injectable, ConflictException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Organization } from '../../domain/organization.entity';
import { OrganizationMember, UserRole } from '../../domain/organization-member.entity';
import { IOrganizationRepository, I_ORGANIZATION_REPOSITORY } from '../../domain/ports/organization.repository.interface';
import { IUserRepository, I_USER_REPOSITORY } from '../../../user/domain/ports/user.repository.interface';
import { User } from '../../../user/domain/user.entity';
import { getCurrency } from '../../../common/utils/currency.util';

export interface CreateOrganizationCommand {
  ownerId?: string;
  name: string;
  userPhoneNumber?: string;
  currency?: string; // ISO 4217 currency code, defaults to 'XOF'
  businessType?: string; // e.g. maquis, restaurant, bar, evenementiel, commerce
  telegramUserId?: string; // Telegram user ID to link to the user account
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
    const { ownerId, name, userPhoneNumber } = command;
    let userId = ownerId;
    let user = userId ? await this.userRepository.findById(userId) : null;

    // If user not found by ID, try to find by Telegram user ID if provided
    if (!user && command.telegramUserId) {
        user = await this.userRepository.findByTelegramUserId(command.telegramUserId);
    }

    // If user not found by ID or Telegram, try to find by phone number if provided
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
            new Date(),
            'fr',
            command.telegramUserId || null,
        );
        user = await this.userRepository.create(newUser);
    }

    // Link Telegram user ID to existing user if not already set
    if (user && command.telegramUserId && !user.telegramUserId) {
        const existingTgUser = await this.userRepository.findByTelegramUserId(command.telegramUserId);
        if (existingTgUser && existingTgUser.id !== user.id) {
            throw new ConflictException('This Telegram account is already linked to another user.');
        }
        user.telegramUserId = command.telegramUserId;
        await this.userRepository.update(user);
    }

    if (!user) {
      throw new Error('User not found and no phone number provided to create one.');
    }
    
    userId = user.id;

    const organizationId = uuidv4();
    const settings: Record<string, any> = { currency: command.currency || getCurrency() };
    if (command.businessType) {
      settings.businessType = command.businessType;
    }

    const newOrganization = new Organization(
      organizationId,
      name,
      userId,
      settings,
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
