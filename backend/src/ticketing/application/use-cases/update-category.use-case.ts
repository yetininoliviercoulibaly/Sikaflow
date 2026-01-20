import { Injectable, Inject, Logger } from '@nestjs/common';
import { ITicketCategoryRepository, I_TICKET_CATEGORY_REPOSITORY } from '../../domain/ports/ticket-category.repository.interface';

export interface UpdateCategoryDto {
  name?: string;
  price?: number;
  capacity?: number;
  benefits?: string[];
}

@Injectable()
export class UpdateCategoryUseCase {
  private readonly logger = new Logger(UpdateCategoryUseCase.name);

  constructor(
    @Inject(I_TICKET_CATEGORY_REPOSITORY)
    private readonly categoryRepository: ITicketCategoryRepository,
  ) {}

  async execute(categoryId: string, dto: UpdateCategoryDto): Promise<void> {
    const category = await this.categoryRepository.findById(categoryId);
    if (!category) {
      throw new Error('Category not found');
    }

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
