import { Controller, Post, Get, Body, Param, Delete, Query, BadRequestException, UseGuards } from '@nestjs/common';
import { CreateOrganizationUseCase } from '../use-cases/create-organization.use-case';
import { AddMemberUseCase } from '../use-cases/add-member.use-case';
import { RemoveMemberUseCase } from '../use-cases/remove-member.use-case';
import { GetOrganizationsByPhoneUseCase } from '../use-cases/get-organizations-by-phone.use-case';
import { GetOrganizationsByTelegramUseCase } from '../use-cases/get-organizations-by-telegram.use-case';
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
    private readonly getOrganizationsByTelegramUseCase: GetOrganizationsByTelegramUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get organizations by phone number or Telegram user ID (ZeroClaw M2M lookup)' })
  @ApiQuery({ name: 'phoneNumber', required: false, description: 'Phone number in E.164 format' })
  @ApiQuery({ name: 'telegramUserId', required: false, description: 'Telegram user ID (numeric)' })
  @ApiResponse({ status: 200, description: 'With phoneNumber: OrganizationWithRole[]. With telegramUserId: { userPhoneNumber: string | null, organizations: OrganizationWithRole[] }.' })
  @ApiResponse({ status: 400, description: 'Missing phoneNumber or telegramUserId query parameter.' })
  async getOrganizations(
    @Query('phoneNumber') phoneNumber?: string,
    @Query('telegramUserId') telegramUserId?: string,
  ) {
    if (telegramUserId) {
      if (!/^\d{1,20}$/.test(telegramUserId)) {
        throw new BadRequestException('telegramUserId must be a numeric string');
      }
      return this.getOrganizationsByTelegramUseCase.execute({ telegramUserId });
    }
    if (phoneNumber) {
      return this.getOrganizationsByPhoneUseCase.execute({ phoneNumber });
    }
    throw new BadRequestException('phoneNumber or telegramUserId query param is required');
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
