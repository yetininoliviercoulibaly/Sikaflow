import { Injectable, Inject, Logger } from '@nestjs/common';
import { ITicketCategoryRepository, I_TICKET_CATEGORY_REPOSITORY } from '../../domain/ports/ticket-category.repository.interface';

export interface UpdateCategoryDto {
  name?: string;
  price?: number;
  capacity?: number;
  benefits?: string[];
}

import { UserRole } from '../../../organization/domain/organization-member.entity';
import { I_PERMISSION_SERVICE, IPermissionService } from '../../domain/services/permission.service';
import { I_EVENT_REPOSITORY, IEventRepository } from '../../domain/ports/event.repository.interface';

@Injectable()
export class UpdateCategoryUseCase {
  private readonly logger = new Logger(UpdateCategoryUseCase.name);

  constructor(
    @Inject(I_TICKET_CATEGORY_REPOSITORY)
    private readonly categoryRepository: ITicketCategoryRepository,
    @Inject(I_EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,
    @Inject(I_PERMISSION_SERVICE)
    private readonly permissionService: IPermissionService,
  ) {}

  async execute(categoryId: string, dto: UpdateCategoryDto, organizationId: string, userRole?: UserRole): Promise<void> {
    const category = await this.categoryRepository.findById(categoryId);
    if (!category) {
      throw new Error('Category not found');
    }

    const event = await this.eventRepository.findById(category.eventId);
    if (!event) {
        throw new Error('Event not found'); // Should technically exist if category exists, but good for safety
    }

    this.permissionService.verifyEventOwnership(event, organizationId, userRole);

    // Validate capacity change
    if (dto.capacity !== undefined && dto.capacity < category.soldCount) {
      throw new Error(`Cannot reduce capacity below sold count (${category.soldCount} already sold)`);
    }

    // Apply updates
    if (dto.name !== undefined) category.name = dto.name;
    if (dto.price !== undefined) category.price = dto.price;
    if (dto.capacity !== undefined) category.capacity = dto.capacity;
    if (dto.benefits !== undefined) category.benefits = dto.benefits;

    await this.categoryRepository.update(category);
    this.logger.log(`Updated category ${categoryId}`);
  }
}
