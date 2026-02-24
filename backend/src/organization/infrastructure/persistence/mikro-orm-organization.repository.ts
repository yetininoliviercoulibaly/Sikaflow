import { EntityManager } from '@mikro-orm/postgresql'; // or core
import { Injectable } from '@nestjs/common';
import { Organization } from '../../domain/organization.entity';
import { OrganizationMember, UserRole } from '../../domain/organization-member.entity';
import { IOrganizationRepository, OrganizationWithRole } from '../../domain/ports/organization.repository.interface';
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

  async findOwner(organizationId: string): Promise<OrganizationMember | null> {
    return this.em.findOne(OrganizationMember, { organizationId, role: UserRole.OWNER });
  }

  async findOrganizationsForUser(userId: string): Promise<Organization[]> {
    // Optimized: Use native SQL query with JOIN instead of N+1 pattern
    const knex = this.em.getKnex();
    const rows = await knex('organization as o')
      .select('o.*')
      .innerJoin('organization_member as m', 'o.id', 'm.organization_id')
      .where('m.user_id', userId);
    
    // Map raw rows back to entities
    return rows.map((row: any) => new Organization(
      row.id,
      row.name,
      row.owner_id,
      row.settings || {},
      row.created_at,
      row.subscription_expires_at,
      row.current_plan_id
    ));
  }

  async findByPhoneNumber(phoneNumber: string): Promise<OrganizationWithRole[]> {
    const knex = this.em.getKnex();
    const rows = await knex('organization as o')
      .select('o.id', 'o.name', 'om.role')
      .innerJoin('organization_member as om', 'o.id', 'om.organization_id')
      .innerJoin('users as u', 'om.user_id', 'u.id')
      .where('u.phone_number', phoneNumber);

    return rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      role: row.role,
    }));
  }

  async removeMember(organizationId: string, userId: string): Promise<void> {
    const member = await this.em.findOne(OrganizationMember, { organizationId, userId });
    if (member) {
      this.em.remove(member);
      await this.em.flush();
    }
  }
}

