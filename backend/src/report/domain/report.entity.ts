import { Organization } from '../../organization/domain/organization.entity';
import { v4 } from 'uuid';

export enum ReportType {
  FLASH = 'FLASH',
  WEEKLY = 'WEEKLY',
}

export class Report {
  id: string = v4();
  organization: Organization;
  type: ReportType;
  periodStart?: Date;
  periodEnd?: Date;
  data: any;
  generatedAt: Date = new Date();

  constructor(organization: Organization, type: ReportType, data: any, periodStart?: Date, periodEnd?: Date) {
    this.organization = organization;
    this.type = type;
    this.data = data;
    this.periodStart = periodStart;
    this.periodEnd = periodEnd;
  }
}
