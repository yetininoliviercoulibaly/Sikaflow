import { Organization } from '../organization.entity';
import { OrganizationMember } from '../organization-member.entity';

export const I_ORGANIZATION_REPOSITORY = 'I_ORGANIZATION_REPOSITORY';

export interface OrganizationWithRole {
  id: string;
  name: string;
  role: string;
}

export interface IOrganizationRepository {
  findById(id: string): Promise<Organization | null>;
  create(organization: Organization): Promise<Organization>;
  getMembers(organizationId: string): Promise<OrganizationMember[]>;
  addMember(member: OrganizationMember): Promise<void>;
  findMember(organizationId: string, userId: string): Promise<OrganizationMember | null>;
  findOwner(organizationId: string): Promise<OrganizationMember | null>;
  findOrganizationsForUser(userId: string): Promise<Organization[]>;
  findByPhoneNumber(phoneNumber: string): Promise<OrganizationWithRole[]>;
  removeMember(organizationId: string, userId: string): Promise<void>;
}
