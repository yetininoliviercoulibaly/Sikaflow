
import { Injectable, Inject } from '@nestjs/common';
import { IEventRepository, I_EVENT_REPOSITORY } from '../../domain/ports/event.repository.interface';
import { ITicketCategoryRepository, I_TICKET_CATEGORY_REPOSITORY } from '../../domain/ports/ticket-category.repository.interface';
import { Event } from '../../domain/event.entity';
import { TicketCategory } from '../../domain/ticket-category.entity';
import { v4 as uuidv4 } from 'uuid';

export interface CreateCategoryDto {
  name: string;
  price: number;
  capacity: number;
  isDefault?: boolean;
  benefits?: string[];
}

@Injectable()
export class CreateEventUseCase {
  constructor(
    @Inject(I_EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,
    @Inject(I_TICKET_CATEGORY_REPOSITORY)
    private readonly categoryRepository: ITicketCategoryRepository,
  ) {}

  async execute(
    organizationId: string, 
    name: string, 
    dateStr: string, 
    capacity: number, 
    price: number,
    categories?: CreateCategoryDto[]
  ): Promise<Event> {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
        throw new Error('Invalid Date format');
    }
    if (date < new Date()) {
        throw new Error('Event date must be in the future');
    }

    const eventId = uuidv4();
    const event = new Event(
        eventId,
        organizationId,
        name,
        date,
        capacity,
        price
    );

    await this.eventRepository.save(event);

    // Create categories (or default if none provided)
    if (categories && categories.length > 0) {
      // Ensure at least one is default
      const hasDefault = categories.some(c => c.isDefault);
      for (let i = 0; i < categories.length; i++) {
        const cat = categories[i];
        const category = new TicketCategory(
          eventId,
          cat.name,
          cat.price,
          cat.capacity,
          cat.isDefault || (!hasDefault && i === 0), // First becomes default if none specified
          cat.benefits || []
        );
        await this.categoryRepository.save(category);
      }
    } else {
      // Create a default "Standard" category with same price/capacity as event
      const defaultCategory = new TicketCategory(
        eventId,
        'Standard',
        price,
        capacity,
        true, // isDefault
        []
      );
      await this.categoryRepository.save(defaultCategory);
    }
    
    return event;
  }
}
