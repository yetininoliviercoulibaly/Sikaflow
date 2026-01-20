import { Injectable, Inject, Logger } from '@nestjs/common';
import { ITicketCategoryRepository, I_TICKET_CATEGORY_REPOSITORY } from '../../domain/ports/ticket-category.repository.interface';
import { IEventRepository, I_EVENT_REPOSITORY } from '../../domain/ports/event.repository.interface';
import { TicketCategory } from '../../domain/ticket-category.entity';

import { UserRole } from '../../../organization/domain/organization-member.entity';
import { I_PERMISSION_SERVICE, IPermissionService } from '../../domain/services/permission.service';

export interface CreateCategoryDto {
  name: string;
  price: number;
  capacity: number;
  isDefault?: boolean;
  benefits?: string[];
}

@Injectable()
export class CreateCategoryUseCase {
  private readonly logger = new Logger(CreateCategoryUseCase.name);

  constructor(
    @Inject(I_TICKET_CATEGORY_REPOSITORY)
    private readonly categoryRepository: ITicketCategoryRepository,
    @Inject(I_EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,
    @Inject(I_PERMISSION_SERVICE)
    private readonly permissionService: IPermissionService,
  ) {}

  async execute(eventId: string, dto: CreateCategoryDto, organizationId: string, userRole?: UserRole): Promise<TicketCategory> {
    // Verify event exists
    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    this.permissionService.verifyEventOwnership(event, organizationId, userRole);

    // If this is marked as default, unset other defaults (bulk update)
    if (dto.isDefault) {
      await this.categoryRepository.unsetDefaultForEvent(eventId);
    }

    const category = new TicketCategory(
      eventId,
      dto.name,
      dto.price,
      dto.capacity,
      dto.isDefault || false,
      dto.benefits || []
    );

    await this.categoryRepository.save(category);
    this.logger.log(`Created category '${dto.name}' for event ${eventId}`);

    return category;
  }
}
