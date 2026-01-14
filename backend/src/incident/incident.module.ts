import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { IncidentSchema } from './infrastructure/persistence/incident.schema';
import { MikroOrmIncidentRepository } from './infrastructure/persistence/mikro-orm-incident.repository';
import { I_INCIDENT_REPOSITORY } from './domain/ports/incident.repository.interface';

@Module({
  imports: [
    MikroOrmModule.forFeature([IncidentSchema]),
  ],
  providers: [
    {
      provide: I_INCIDENT_REPOSITORY,
      useClass: MikroOrmIncidentRepository,
    },
  ],
  exports: [I_INCIDENT_REPOSITORY],
})
export class IncidentModule {}
