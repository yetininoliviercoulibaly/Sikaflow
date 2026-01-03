import { Entity, PrimaryKey, Property, Enum, ManyToOne } from '@mikro-orm/core';
import { Organization } from '../../organization/domain/organization.entity';
import { v4 } from 'uuid';

export enum ReportType {
  FLASH = 'FLASH',
  WEEKLY = 'WEEKLY',
}

@Entity({ tableName: 'report' })
export class Report {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4();

  @ManyToOne(() => Organization)
  organization: Organization;

  @Enum(() => ReportType)
  type: ReportType;

  @Property({ nullable: true })
  periodStart?: Date;

  @Property({ nullable: true })
  periodEnd?: Date;

  @Property({ type: 'jsonb' })
  data: any;

  @Property({ onCreate: () => new Date() })
  generatedAt: Date = new Date();

  constructor(organization: Organization, type: ReportType, data: any, periodStart?: Date, periodEnd?: Date) {
    this.organization = organization;
    this.type = type;
    this.data = data;
    this.periodStart = periodStart;
    this.periodEnd = periodEnd;
  }
}
