import { Controller, Post, Body, Param, Delete, Query, BadRequestException, UseGuards } from '@nestjs/common';
import { CreateOrganizationUseCase } from '../use-cases/create-organization.use-case';
import { AddMemberUseCase } from '../use-cases/add-member.use-case';
import { RemoveMemberUseCase } from '../use-cases/remove-member.use-case';
import { CreateOrganizationDto, AddMemberDto } from '../dtos/organization.dtos';
import { ApiKeyGuard } from '../../../common/guards/api-key.guard';
import { CompositeAuthGuard } from '../../../common/guards/composite-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../organization/domain/organization-member.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';

@ApiTags('Organizations')
@ApiSecurity('api-key')
@ApiSecurity('bearer')
@Controller('organizations')
@UseGuards(CompositeAuthGuard, RolesGuard)
export class OrganizationController {
  constructor(
    private readonly createOrganizationUseCase: CreateOrganizationUseCase,
    private readonly addMemberUseCase: AddMemberUseCase,
    private readonly removeMemberUseCase: RemoveMemberUseCase,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new organization' })
  @ApiResponse({ status: 201, description: 'The organization has been successfully created.' })
  async create(@Body() createOrganizationDto: CreateOrganizationDto) {
    return this.createOrganizationUseCase.execute(createOrganizationDto);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add a member to an organization' })
  @ApiResponse({ status: 201, description: 'Member added successfully.' })
  async addMember(
    @Param('id') id: string,
    @Body() addMemberDto: AddMemberDto,
  ) {
    return this.addMemberUseCase.execute({
      ...addMemberDto,
      organizationId: id,
    });
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Remove a member from an organization' })
  @ApiResponse({ status: 200, description: 'Member removed successfully.' })
  async removeMember(
    @Param('id') organizationId: string,
    @Param('userId') targetUserId: string,
    @Query('requesterId') requesterId: string, 
  ) {
      if (!requesterId) {
          throw new BadRequestException('requesterId query param is required');
      }
      return this.removeMemberUseCase.execute({
          requesterId,
          organizationId,
          targetUserId,
      });
  }
}
