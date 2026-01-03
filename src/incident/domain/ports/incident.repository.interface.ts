import { Incident } from '../incident.entity';

export const I_INCIDENT_REPOSITORY = 'I_INCIDENT_REPOSITORY';

export interface IIncidentRepository {
  findById(id: string): Promise<Incident | null>;
  create(incident: Incident): Promise<Incident>;
  findByOrganization(organizationId: string): Promise<Incident[]>;
  // Add other methods as needed
}
