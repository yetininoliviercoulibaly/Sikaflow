import { Injectable, Inject } from '@nestjs/common';
import { ITicketCategoryRepository, I_TICKET_CATEGORY_REPOSITORY } from '../../domain/ports/ticket-category.repository.interface';
import { IEventRepository, I_EVENT_REPOSITORY } from '../../domain/ports/event.repository.interface';
import { TicketCategory } from '../../domain/ticket-category.entity';

import { UserRole } from '../../../organization/domain/organization-member.entity';

@Injectable()
export class ListCategoriesUseCase {
  constructor(
    @Inject(I_TICKET_CATEGORY_REPOSITORY)
    private readonly categoryRepository: ITicketCategoryRepository,
    @Inject(I_EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,
  ) {}

  async execute(eventId: string, organizationId: string, userRole?: UserRole): Promise<TicketCategory[]> {
    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    if (userRole !== UserRole.ADMIN && event.organizationId !== organizationId) {
      // Forbidden - either throw error or return empty array depending on requirement.
      // PR feedback suggests verification, so throwing is safer.
      throw new Error('Forbidden: You do not own this event');
    }

    return this.categoryRepository.findByEventId(eventId);
  }
}
