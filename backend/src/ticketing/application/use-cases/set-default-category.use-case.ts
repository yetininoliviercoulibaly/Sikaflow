import { Injectable, Inject, Logger } from '@nestjs/common';
import { ITicketCategoryRepository, I_TICKET_CATEGORY_REPOSITORY } from '../../domain/ports/ticket-category.repository.interface';

@Injectable()
export class SetDefaultCategoryUseCase {
  private readonly logger = new Logger(SetDefaultCategoryUseCase.name);

  constructor(
    @Inject(I_TICKET_CATEGORY_REPOSITORY)
    private readonly categoryRepository: ITicketCategoryRepository,
  ) {}

  async execute(categoryId: string): Promise<void> {
    const category = await this.categoryRepository.findById(categoryId);
    if (!category) {
      throw new Error('Category not found');
    }

    // Unset all other defaults for this event (bulk update)
    await this.categoryRepository.unsetDefaultForEvent(category.eventId);

    // Set this one as default
    category.isDefault = true;
    await this.categoryRepository.update(category);
    this.logger.log(`Set category '${category.name}' as default for event ${category.eventId}`);
  }
}
