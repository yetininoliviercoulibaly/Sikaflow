import { Inject, Injectable } from '@nestjs/common';
import {
  IOrganizationRepository,
  I_ORGANIZATION_REPOSITORY,
  OrganizationWithRole,
} from '../../domain/ports/organization.repository.interface';

export interface GetOrganizationsByPhoneCommand {
  phoneNumber: string;
}

@Injectable()
export class GetOrganizationsByPhoneUseCase {
  constructor(
    @Inject(I_ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: IOrganizationRepository,
  ) {}

  async execute(command: GetOrganizationsByPhoneCommand): Promise<OrganizationWithRole[]> {
    return this.organizationRepository.findByPhoneNumber(command.phoneNumber);
  }
}
