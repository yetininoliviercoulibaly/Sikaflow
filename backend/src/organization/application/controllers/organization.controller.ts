import { Controller, Post, Get, Body, Param, Delete, Query, BadRequestException, UseGuards } from '@nestjs/common';
import { CreateOrganizationUseCase } from '../use-cases/create-organization.use-case';
import { AddMemberUseCase } from '../use-cases/add-member.use-case';
import { RemoveMemberUseCase } from '../use-cases/remove-member.use-case';
import { GetOrganizationsByPhoneUseCase } from '../use-cases/get-organizations-by-phone.use-case';
import { CreateOrganizationDto, AddMemberDto } from '../dtos/organization.dtos';
import { CompositeAuthGuard } from '../../../common/guards/composite-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity, ApiQuery } from '@nestjs/swagger';

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
    private readonly getOrganizationsByPhoneUseCase: GetOrganizationsByPhoneUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get organizations by phone number (ZeroClaw M2M lookup)' })
  @ApiQuery({ name: 'phoneNumber', required: true, description: 'Phone number in E.164 format' })
  @ApiResponse({ status: 200, description: 'List of organizations for this phone number (empty array if unknown).' })
  @ApiResponse({ status: 400, description: 'Missing phoneNumber query parameter.' })
  async getByPhone(@Query('phoneNumber') phoneNumber: string) {
    if (!phoneNumber) {
      throw new BadRequestException('phoneNumber query param is required');
    }
    return this.getOrganizationsByPhoneUseCase.execute({ phoneNumber });
  }

  @Post()
  @ApiOperation({ summary: 'Create a new organization (ZeroClaw M2M or authenticated user)' })
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
