import { Injectable, Inject } from '@nestjs/common';
import { ITicketCategoryRepository, I_TICKET_CATEGORY_REPOSITORY } from '../../domain/ports/ticket-category.repository.interface';
import { TicketCategory } from '../../domain/ticket-category.entity';

@Injectable()
export class ListCategoriesUseCase {
  constructor(
    @Inject(I_TICKET_CATEGORY_REPOSITORY)
    private readonly categoryRepository: ITicketCategoryRepository,
  ) {}

  async execute(eventId: string): Promise<TicketCategory[]> {
    return this.categoryRepository.findByEventId(eventId);
  }
}
