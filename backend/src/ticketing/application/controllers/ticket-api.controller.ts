import { Controller, Post, Body, UseGuards, Req, HttpCode, HttpStatus, ForbiddenException } from '@nestjs/common';
import { ValidateTicketUseCase, ValidateTicketResult } from '../use-cases/validate-ticket.use-case';
import { CompositeAuthGuard } from '../../../common/guards/composite-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../organization/domain/organization-member.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity, ApiBody } from '@nestjs/swagger';
import { IEventRepository, I_EVENT_REPOSITORY } from '../../domain/ports/event.repository.interface';
import { ITicketRepository, I_TICKET_REPOSITORY } from '../../domain/ports/ticket.repository.interface';
import { Inject } from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class ValidateTicketDto {
  @IsString()
  @IsNotEmpty()
  hash: string;

  @IsOptional()
  @IsBoolean()
  markAsUsed?: boolean;
}

@ApiTags('Tickets')
@ApiSecurity('bearer')
@Controller('api/v1/tickets')
@UseGuards(CompositeAuthGuard, RolesGuard)
export class TicketApiController {
  constructor(
    private readonly validateTicketUseCase: ValidateTicketUseCase,
    @Inject(I_TICKET_REPOSITORY) private readonly ticketRepository: ITicketRepository,
    @Inject(I_EVENT_REPOSITORY) private readonly eventRepository: IEventRepository,
  ) {}

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Validate a ticket by its QR hash' })
  @ApiBody({ type: ValidateTicketDto })
  @ApiResponse({ status: 200, description: 'Ticket validation result' })
  @ApiResponse({ status: 403, description: 'Ticket does not belong to this organization' })
  async validate(
    @Req() req: any,
    @Body() dto: ValidateTicketDto,
  ): Promise<ValidateTicketResult> {
    const orgId = req.user.orgId;
    
    // First validate without marking to check ownership
    const preCheck = await this.validateTicketUseCase.execute(dto.hash, false);
    
    // If ticket was found, verify it belongs to the scanner's organization
    if (preCheck.ticketId) {
      const ticket = await this.ticketRepository.findById(preCheck.ticketId);
      if (ticket) {
        const event = await this.eventRepository.findById(ticket.eventId);
        if (event && event.organizationId !== orgId) {
          throw new ForbiddenException('Ce billet appartient à une autre organisation');
        }
      }
    }

    // Now perform the actual validation (with marking as used if requested)
    const markAsUsed = dto.markAsUsed !== false; // Default to true
    return this.validateTicketUseCase.execute(dto.hash, markAsUsed);
  }
}
