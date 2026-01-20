import { Injectable, Inject } from '@nestjs/common';
import { ITicketCategoryRepository, I_TICKET_CATEGORY_REPOSITORY } from '../../domain/ports/ticket-category.repository.interface';
import { IEventRepository, I_EVENT_REPOSITORY } from '../../domain/ports/event.repository.interface';
import { TicketCategory } from '../../domain/ticket-category.entity';

import { UserRole } from '../../../organization/domain/organization-member.entity';
import { I_PERMISSION_SERVICE, IPermissionService } from '../../domain/services/permission.service';

@Injectable()
export class ListCategoriesUseCase {
  constructor(
    @Inject(I_TICKET_CATEGORY_REPOSITORY)
    private readonly categoryRepository: ITicketCategoryRepository,
    @Inject(I_EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,
    @Inject(I_PERMISSION_SERVICE)
    private readonly permissionService: IPermissionService,
  ) {}

  async execute(eventId: string, organizationId: string, userRole?: UserRole): Promise<TicketCategory[]> {
    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    this.permissionService.verifyEventOwnership(event, organizationId, userRole);

    return this.categoryRepository.findByEventId(eventId);
  }
}
