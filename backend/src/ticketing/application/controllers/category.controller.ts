  Controller, Get, Post, Put, Delete, 
  Param, Body, UseGuards, HttpCode, HttpStatus, Req, UnauthorizedException 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity, ApiBody, ApiParam } from '@nestjs/swagger';
import { CompositeAuthGuard } from '../../../common/guards/composite-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../organization/domain/organization-member.entity';
import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, Min } from 'class-validator';

import { ListCategoriesUseCase } from '../use-cases/list-categories.use-case';
import { CreateCategoryUseCase } from '../use-cases/create-category.use-case';
import { UpdateCategoryUseCase } from '../use-cases/update-category.use-case';
import { DeleteCategoryUseCase } from '../use-cases/delete-category.use-case';
import { SetDefaultCategoryUseCase } from '../use-cases/set-default-category.use-case';

// DTOs
export class CreateCategoryRequestDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(1)
  capacity: number;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  benefits?: string[];
}

export class UpdateCategoryRequestDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  benefits?: string[];
}

@ApiTags('Categories')
@ApiSecurity('bearer')
@Controller('api/v1/events/:eventId/categories')
@UseGuards(CompositeAuthGuard, RolesGuard)
export class CategoryController {
  constructor(
    private readonly listCategoriesUseCase: ListCategoriesUseCase,
    private readonly createCategoryUseCase: CreateCategoryUseCase,
    private readonly updateCategoryUseCase: UpdateCategoryUseCase,
    private readonly deleteCategoryUseCase: DeleteCategoryUseCase,
    private readonly setDefaultCategoryUseCase: SetDefaultCategoryUseCase,
  ) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'List all categories for an event' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'List of categories' })
  async list(@Param('eventId') eventId: string, @Req() req: any) {
    const orgId = req.user.orgId;
    const userRole = req.user.role;
    if (!orgId) throw new UnauthorizedException('Organization ID missing in token');
    return this.listCategoriesUseCase.execute(eventId, orgId, userRole);
  }

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new category for an event' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiBody({ type: CreateCategoryRequestDto })
  @ApiResponse({ status: 201, description: 'Category created' })
  async create(
    @Param('eventId') eventId: string,
    @Body() dto: CreateCategoryRequestDto,
    @Req() req: any,
  ) {
    const orgId = req.user.orgId;
    const userRole = req.user.role;
    if (!orgId) throw new UnauthorizedException('Organization ID missing in token');
    return this.createCategoryUseCase.execute(eventId, dto, orgId, userRole);
  }

  @Put(':categoryId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update a category' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiParam({ name: 'categoryId', description: 'Category ID' })
  @ApiBody({ type: UpdateCategoryRequestDto })
  @ApiResponse({ status: 204, description: 'Category updated' })
  async update(
    @Param('categoryId') categoryId: string,
    @Body() dto: UpdateCategoryRequestDto,
    @Req() req: any,
  ) {
    const orgId = req.user.orgId;
    const userRole = req.user.role;
    if (!orgId) throw new UnauthorizedException('Organization ID missing in token');
    await this.updateCategoryUseCase.execute(categoryId, dto, orgId, userRole);
  }

  @Delete(':categoryId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Delete a category (blocked if tickets sold)' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiParam({ name: 'categoryId', description: 'Category ID' })
  @ApiResponse({ status: 204, description: 'Category deleted' })
  @ApiResponse({ status: 400, description: 'Cannot delete - tickets already sold' })
  async delete(
    @Param('categoryId') categoryId: string,
    @Req() req: any,
  ) {
    const orgId = req.user.orgId;
    const userRole = req.user.role;
    if (!orgId) throw new UnauthorizedException('Organization ID missing in token');
    await this.deleteCategoryUseCase.execute(categoryId, orgId, userRole);
  }

  @Post(':categoryId/set-default')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Set a category as the default for the event' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiParam({ name: 'categoryId', description: 'Category ID' })
  @ApiResponse({ status: 204, description: 'Category set as default' })
  async setDefault(
    @Param('eventId') eventId: string,
    @Param('categoryId') categoryId: string,
    @Req() req: any,
  ) {
    const orgId = req.user.orgId;
    const userRole = req.user.role;
    if (!orgId) throw new UnauthorizedException('Organization ID missing in token');
    
    // We pass eventId to ensure the category matches the URL param if needed, 
    // but the use-case will verify category ownership via organizationId
    await this.setDefaultCategoryUseCase.execute(categoryId, orgId, userRole);
  }
}
