import { Controller, Post, Body, Param, Delete, Query, BadRequestException } from '@nestjs/common';
import { CreateOrganizationUseCase } from '../use-cases/create-organization.use-case';
import { AddMemberUseCase } from '../use-cases/add-member.use-case';
import { RemoveMemberUseCase } from '../use-cases/remove-member.use-case';
import { CreateOrganizationDto, AddMemberDto } from '../dtos/organization.dtos';

@Controller('organizations')
export class OrganizationController {
  constructor(
    private readonly createOrganizationUseCase: CreateOrganizationUseCase,
    private readonly addMemberUseCase: AddMemberUseCase,
    private readonly removeMemberUseCase: RemoveMemberUseCase,
  ) {}

  @Post()
  async create(@Body() createOrganizationDto: CreateOrganizationDto) {
    return this.createOrganizationUseCase.execute(createOrganizationDto);
  }

  @Post(':id/members')
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
  async removeMember(
    @Param('id') organizationId: string,
    @Param('userId') targetUserId: string,
    // Using Query for requesterId in this phase as we don't have Auth middleware injecting user yet
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
