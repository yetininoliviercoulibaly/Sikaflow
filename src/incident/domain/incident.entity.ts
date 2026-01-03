export enum IncidentSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum IncidentStatus {
  OPEN = 'OPEN',
  RESOLVED = 'RESOLVED',
}

export class Incident {
  constructor(
    public id: string,
    public organizationId: string,
    public reportedByUserId: string | null,
    public originMessageId: string | null,
    public severity: IncidentSeverity,
    public description: string | null,
    public status: IncidentStatus,
    public occurredAt: Date,
    public createdAt: Date,
  ) {}
}
