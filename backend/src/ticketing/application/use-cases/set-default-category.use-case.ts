import { Injectable, Inject, Logger } from '@nestjs/common';
import { ITicketCategoryRepository, I_TICKET_CATEGORY_REPOSITORY } from '../../domain/ports/ticket-category.repository.interface';
import { IEventRepository, I_EVENT_REPOSITORY } from '../../domain/ports/event.repository.interface';

@Injectable()
export class SetDefaultCategoryUseCase {
  private readonly logger = new Logger(SetDefaultCategoryUseCase.name);

  constructor(
    @Inject(I_TICKET_CATEGORY_REPOSITORY)
    private readonly categoryRepository: ITicketCategoryRepository,
    @Inject(I_EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,
  ) {}

  async execute(categoryId: string, organizationId: string): Promise<void> {
    const category = await this.categoryRepository.findById(categoryId);
    if (!category) {
      throw new Error('Category not found');
    }

    const event = await this.eventRepository.findById(category.eventId);
    if (!event) {
       throw new Error('Event not found');
    }

    if (event.organizationId !== organizationId) {
      throw new Error('Forbidden: You do not own this event');
    }

    // Unset all other defaults for this event (bulk update)
    await this.categoryRepository.unsetDefaultForEvent(category.eventId);

    // Set this one as default
    category.isDefault = true;
    await this.categoryRepository.update(category);
    this.logger.log(`Set category '${category.name}' as default for event ${category.eventId}`);
  }
}
