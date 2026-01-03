import { EntityManager } from '@mikro-orm/postgresql'; // or core
import { Injectable } from '@nestjs/common';
import { Organization } from '../../domain/organization.entity';
import { OrganizationMember } from '../../domain/organization-member.entity';
import { IOrganizationRepository } from '../../domain/ports/organization.repository.interface';
import { OrganizationSchema } from './organization.schema';
import { OrganizationMemberSchema } from './organization-member.schema';

@Injectable() // NestJS Injectable
export class MikroOrmOrganizationRepository implements IOrganizationRepository {
  constructor(private readonly em: EntityManager) {}

  async findById(id: string): Promise<Organization | null> {
    return this.em.findOne(Organization, { id });
  }

  async create(organization: Organization): Promise<Organization> {
    const newOrg = this.em.create(Organization, organization);
    await this.em.persistAndFlush(newOrg);
    return newOrg;
  }

  async getMembers(organizationId: string): Promise<OrganizationMember[]> {
    return this.em.find(OrganizationMember, { organizationId });
  }

  async addMember(member: OrganizationMember): Promise<void> {
    const newMember = this.em.create(OrganizationMember, member);
    await this.em.persistAndFlush(newMember);
  }

  async findMember(organizationId: string, userId: string): Promise<OrganizationMember | null> {
    return this.em.findOne(OrganizationMember, { organizationId, userId });
  }

  async findOrganizationsForUser(userId: string): Promise<Organization[]> {
    const members = await this.em.find(OrganizationMember, { userId });
    const organizationIds = members.map((m) => m.organizationId);
    if (organizationIds.length === 0) return [];
    return this.em.find(Organization, { id: { $in: organizationIds } });
  }

  async removeMember(organizationId: string, userId: string): Promise<void> {
    const member = await this.em.findOne(OrganizationMember, { organizationId, userId });
    if (member) {
      this.em.remove(member);
      await this.em.flush();
    }
  }
}

