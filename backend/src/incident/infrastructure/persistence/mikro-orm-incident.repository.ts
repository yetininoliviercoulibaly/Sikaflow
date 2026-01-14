import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { Incident } from '../../domain/incident.entity';
import { IIncidentRepository } from '../../domain/ports/incident.repository.interface';

@Injectable()
export class MikroOrmIncidentRepository implements IIncidentRepository {
  constructor(private readonly em: EntityManager) {}

  async findById(id: string): Promise<Incident | null> {
    return this.em.findOne(Incident, { id });
  }

  async create(incident: Incident): Promise<Incident> {
    const newIncident = this.em.create(Incident, incident);
    await this.em.persistAndFlush(newIncident);
    return newIncident;
  }

  async findByOrganization(organizationId: string): Promise<Incident[]> {
    return this.em.find(Incident, { organizationId });
  }
}
