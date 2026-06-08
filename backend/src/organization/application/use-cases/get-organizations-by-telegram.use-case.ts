import { Inject, Injectable } from '@nestjs/common';
import {
  IOrganizationRepository,
  I_ORGANIZATION_REPOSITORY,
  OrganizationWithRole,
} from '../../domain/ports/organization.repository.interface';
import { IUserRepository, I_USER_REPOSITORY } from '../../../user/domain/ports/user.repository.interface';

export interface GetOrganizationsByTelegramCommand {
  telegramUserId: string;
}

export interface TelegramLookupResult {
  userPhoneNumber: string | null;
  organizations: OrganizationWithRole[];
}

@Injectable()
export class GetOrganizationsByTelegramUseCase {
  constructor(
    @Inject(I_USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(I_ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: IOrganizationRepository,
  ) {}

  async execute(command: GetOrganizationsByTelegramCommand): Promise<TelegramLookupResult> {
    const user = await this.userRepository.findByTelegramUserId(command.telegramUserId);

    if (!user) {
      return { userPhoneNumber: null, organizations: [] };
    }

    const organizations = await this.organizationRepository.findByPhoneNumber(user.phoneNumber);

    return {
      userPhoneNumber: user.phoneNumber,
      organizations,
    };
  }
}
