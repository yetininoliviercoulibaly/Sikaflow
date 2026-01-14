
import { Controller, Get, Post, Body, Param, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { CreateEventUseCase } from '../../application/use-cases/create-event.use-case';
import { ListEventsUseCase } from '../../application/use-cases/list-events.use-case';
import { GetEventStatsUseCase } from '../../application/use-cases/get-event-stats.use-case';
import { CreateEventDto } from '../../application/dtos/event.dtos';
import { CompositeAuthGuard } from '../../../common/guards/composite-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../organization/domain/organization-member.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';

@ApiTags('Events')
@ApiSecurity('bearer')
@Controller('events')
@UseGuards(CompositeAuthGuard, RolesGuard)
export class EventController {
  constructor(
    private readonly createEventUseCase: CreateEventUseCase,
    private readonly listEventsUseCase: ListEventsUseCase,
    private readonly getEventStatsUseCase: GetEventStatsUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all events for the organization' })
  async list(@Req() req: any) {
    const orgId = req.user.orgId;
    if (!orgId) throw new UnauthorizedException('Organization ID missing in token');
    return this.listEventsUseCase.execute(orgId);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new event' })
  async create(@Req() req: any, @Body() dto: CreateEventDto) {
    const orgId = req.user.orgId;
    if (!orgId) throw new UnauthorizedException('Organization ID missing in token');
    
    return this.createEventUseCase.execute(
      orgId,
      dto.name,
      dto.date,
      dto.totalCapacity,
      dto.price
    );
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get stats for a specific event' })
  async getStats(@Param('id') id: string) {
    return this.getEventStatsUseCase.execute(id);
  }
}
