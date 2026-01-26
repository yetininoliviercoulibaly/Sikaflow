import { Injectable, Inject } from '@nestjs/common';
import { z } from 'zod';
import { BaseTool } from './base.tool';
import { IIncidentRepository, I_INCIDENT_REPOSITORY } from '../../incident/domain/ports/incident.repository.interface';
import { Incident, IncidentSeverity, IncidentStatus } from '../../incident/domain/incident.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ReportIncidentTool extends BaseTool<any> {
  name = 'report_incident';
  description = 'Reports a security or operational incident for an organization.';
  
  schema = z.object({
    organizationId: z.string().describe('The ID of the organization.'),
    userId: z.string().describe('The ID of the user reporting the incident.'),
    description: z.string().describe('Detailed description of the incident.'),
    severity: z.nativeEnum(IncidentSeverity).optional().default(IncidentSeverity.MEDIUM).describe('Severity level (LOW, MEDIUM, HIGH, CRITICAL).'),
  });

  constructor(
      @Inject(I_INCIDENT_REPOSITORY) private readonly incidentRepository: IIncidentRepository
  ) {
    super();
  }

  protected async _call(input: z.infer<typeof this.schema>): Promise<string> {
    return this.handleSafe(async () => {
        const incident = new Incident(
            uuidv4(),
            input.organizationId,
            input.userId,
            null,
            input.severity,
            input.description,
            IncidentStatus.OPEN,
            new Date(),
            new Date()
        );

        await this.incidentRepository.create(incident);
        return `Incident reported successfully (Severity: ${input.severity}). Security team has been notified.`;
    });
  }
}
