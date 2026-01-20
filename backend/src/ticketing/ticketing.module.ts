
import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { EventSchema } from './infrastructure/persistence/event.schema';
import { TicketSchema } from './infrastructure/persistence/ticket.schema';
import { TicketCategorySchema } from './infrastructure/persistence/ticket-category.schema';
import { MikroOrmEventRepository } from './infrastructure/persistence/mikro-orm-event.repository';
import { MikroOrmTicketRepository } from './infrastructure/persistence/mikro-orm-ticket.repository';
import { MikroOrmTicketCategoryRepository } from './infrastructure/persistence/mikro-orm-ticket-category.repository';
import { QRCodeService } from './infrastructure/qrcode.service';
import { I_EVENT_REPOSITORY } from './domain/ports/event.repository.interface';
import { I_TICKET_REPOSITORY } from './domain/ports/ticket.repository.interface';
import { I_TICKET_CATEGORY_REPOSITORY } from './domain/ports/ticket-category.repository.interface';
import { I_QRCODE_SERVICE } from './domain/ports/qrcode.service.interface';
import { TicketClaimSchema } from './infrastructure/persistence/ticket-claim.schema';
import { MikroOrmTicketClaimRepository } from './infrastructure/persistence/mikro-orm-ticket-claim.repository';
import { I_TICKET_CLAIM_REPOSITORY } from './domain/ports/ticket-claim.repository.interface';
import { I_PERMISSION_SERVICE, PermissionService } from './domain/services/permission.service';

import { CreateEventUseCase } from './application/use-cases/create-event.use-case';
import { GetEventUseCase } from './application/use-cases/get-event.use-case';
import { IssueTicketUseCase } from './application/use-cases/issue-ticket.use-case';
import { GenerateClaimLinkUseCase } from './application/use-cases/generate-claim-link.use-case';
import { ClaimTicketUseCase } from './application/use-cases/claim-ticket.use-case';
import { ScanTicketUseCase } from './application/use-cases/scan-ticket.use-case';
import { ListEventsUseCase } from './application/use-cases/list-events.use-case';
import { GetEventStatsUseCase } from './application/use-cases/get-event-stats.use-case';
import { GenerateTicketsQRUseCase } from './application/use-cases/generate-tickets-qr.use-case';
import { ValidateTicketUseCase } from './application/use-cases/validate-ticket.use-case';
import { ListCategoriesUseCase } from './application/use-cases/list-categories.use-case';
import { CreateCategoryUseCase } from './application/use-cases/create-category.use-case';
import { UpdateCategoryUseCase } from './application/use-cases/update-category.use-case';
import { DeleteCategoryUseCase } from './application/use-cases/delete-category.use-case';
import { SetDefaultCategoryUseCase } from './application/use-cases/set-default-category.use-case';

import { EventController } from './application/controllers/event.controller';
import { TicketApiController } from './application/controllers/ticket-api.controller';
import { CategoryController } from './application/controllers/category.controller';
import { LlmModule } from '../common/llm/llm.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MikroOrmModule.forFeature([EventSchema, TicketSchema, TicketClaimSchema, TicketCategorySchema]),
    LlmModule,
    AuthModule,
  ],
  controllers: [EventController, TicketApiController, CategoryController],
  providers: [
    { provide: I_EVENT_REPOSITORY, useClass: MikroOrmEventRepository },
    { provide: I_TICKET_REPOSITORY, useClass: MikroOrmTicketRepository },
    { provide: I_TICKET_CATEGORY_REPOSITORY, useClass: MikroOrmTicketCategoryRepository },
    { provide: I_QRCODE_SERVICE, useClass: QRCodeService },
    { provide: I_TICKET_CLAIM_REPOSITORY, useClass: MikroOrmTicketClaimRepository },
    CreateEventUseCase,
    ListEventsUseCase,
    GetEventUseCase,
    GetEventStatsUseCase,
    IssueTicketUseCase,
    ScanTicketUseCase,
    GenerateClaimLinkUseCase,
    ClaimTicketUseCase,
    GenerateTicketsQRUseCase,
    ValidateTicketUseCase,
    // Category Management
    ListCategoriesUseCase,
    CreateCategoryUseCase,
    UpdateCategoryUseCase,
    DeleteCategoryUseCase,
    SetDefaultCategoryUseCase,
    { provide: I_PERMISSION_SERVICE, useClass: PermissionService },
  ],
  exports: [
    I_EVENT_REPOSITORY, 
    I_TICKET_REPOSITORY,
    I_TICKET_CATEGORY_REPOSITORY,
    I_TICKET_CLAIM_REPOSITORY,
    I_QRCODE_SERVICE,
    CreateEventUseCase,
    ListEventsUseCase,
    GetEventUseCase,
    GetEventStatsUseCase,
    IssueTicketUseCase,
    ScanTicketUseCase,
    GenerateClaimLinkUseCase,
    ClaimTicketUseCase,
    GenerateTicketsQRUseCase,
    ValidateTicketUseCase,
    ListCategoriesUseCase,
    CreateCategoryUseCase,
    UpdateCategoryUseCase,
    DeleteCategoryUseCase,
    SetDefaultCategoryUseCase,
  ],
})
export class TicketingModule {}

