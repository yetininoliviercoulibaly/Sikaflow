import { Injectable, Inject, Logger } from '@nestjs/common';
import { ITicketCategoryRepository, I_TICKET_CATEGORY_REPOSITORY } from '../../domain/ports/ticket-category.repository.interface';

@Injectable()
export class DeleteCategoryUseCase {
  private readonly logger = new Logger(DeleteCategoryUseCase.name);

  constructor(
    @Inject(I_TICKET_CATEGORY_REPOSITORY)
    private readonly categoryRepository: ITicketCategoryRepository,
  ) {}

  async execute(categoryId: string): Promise<void> {
    const category = await this.categoryRepository.findById(categoryId);
    if (!category) {
      throw new Error('Category not found');
    }

    // Block deletion if tickets have been sold
    if (category.soldCount > 0) {
      throw new Error(`Cannot delete category '${category.name}': ${category.soldCount} tickets already sold`);
    }

    // Block deletion of default category if it's the only one
    if (category.isDefault) {
      const allCategories = await this.categoryRepository.findByEventId(category.eventId);
      if (allCategories.length === 1) {
        throw new Error('Cannot delete the only category. Create another category first.');
      }
      // Auto-promote another category to default
      const otherCategory = allCategories.find(c => c.id !== categoryId);
      if (otherCategory) {
        otherCategory.isDefault = true;
        await this.categoryRepository.update(otherCategory);
        this.logger.log(`Promoted category '${otherCategory.name}' to default`);
      }
    }

    await this.categoryRepository.delete(categoryId);
    this.logger.log(`Deleted category ${categoryId}`);
  }
}
