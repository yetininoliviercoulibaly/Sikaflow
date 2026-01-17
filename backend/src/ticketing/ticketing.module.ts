
import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { EventSchema } from './infrastructure/persistence/event.schema';
import { TicketSchema } from './infrastructure/persistence/ticket.schema';
import { MikroOrmEventRepository } from './infrastructure/persistence/mikro-orm-event.repository';
import { MikroOrmTicketRepository } from './infrastructure/persistence/mikro-orm-ticket.repository';
import { QRCodeService } from './infrastructure/qrcode.service';
import { I_EVENT_REPOSITORY } from './domain/ports/event.repository.interface';
import { I_TICKET_REPOSITORY } from './domain/ports/ticket.repository.interface';
import { I_QRCODE_SERVICE } from './domain/ports/qrcode.service.interface';
import { TicketClaimSchema } from './infrastructure/persistence/ticket-claim.schema';
import { MikroOrmTicketClaimRepository } from './infrastructure/persistence/mikro-orm-ticket-claim.repository';
import { I_TICKET_CLAIM_REPOSITORY } from './domain/ports/ticket-claim.repository.interface';

import { CreateEventUseCase } from './application/use-cases/create-event.use-case';
import { IssueTicketUseCase } from './application/use-cases/issue-ticket.use-case';
import { GenerateClaimLinkUseCase } from './application/use-cases/generate-claim-link.use-case';
import { ClaimTicketUseCase } from './application/use-cases/claim-ticket.use-case';
import { ScanTicketUseCase } from './application/use-cases/scan-ticket.use-case';
import { ListEventsUseCase } from './application/use-cases/list-events.use-case';
import { GetEventStatsUseCase } from './application/use-cases/get-event-stats.use-case';
import { EventController } from './application/controllers/event.controller';
import { WhatsAppModule } from '../common/whatsapp/whatsapp.module';
import { LlmModule } from '../common/llm/llm.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MikroOrmModule.forFeature([EventSchema, TicketSchema, TicketClaimSchema]),
    WhatsAppModule,
    MikroOrmModule.forFeature([EventSchema, TicketSchema, TicketClaimSchema]),
    WhatsAppModule,
    LlmModule,
    AuthModule,
  ],
  controllers: [EventController],
  providers: [
    { provide: I_EVENT_REPOSITORY, useClass: MikroOrmEventRepository },
    { provide: I_TICKET_REPOSITORY, useClass: MikroOrmTicketRepository },
    { provide: I_QRCODE_SERVICE, useClass: QRCodeService },
    { provide: I_TICKET_CLAIM_REPOSITORY, useClass: MikroOrmTicketClaimRepository },
    CreateEventUseCase,
    ListEventsUseCase,
    GetEventStatsUseCase,
    IssueTicketUseCase,
    ScanTicketUseCase,
    GenerateClaimLinkUseCase,
    ClaimTicketUseCase,
  ],
  exports: [
    I_EVENT_REPOSITORY, 
    I_TICKET_REPOSITORY, 
    I_TICKET_CLAIM_REPOSITORY,
    I_QRCODE_SERVICE,
    CreateEventUseCase,
    ListEventsUseCase,
    GetEventStatsUseCase,
    IssueTicketUseCase,
    ScanTicketUseCase,
    GenerateClaimLinkUseCase,
    ClaimTicketUseCase,
  ],
})
export class TicketingModule {}
