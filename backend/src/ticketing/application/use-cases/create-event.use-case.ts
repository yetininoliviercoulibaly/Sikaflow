
import { Injectable, Inject } from '@nestjs/common';
import { IEventRepository, I_EVENT_REPOSITORY } from '../../domain/ports/event.repository.interface';
import { Event } from '../../domain/event.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CreateEventUseCase {
  constructor(
    @Inject(I_EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,
  ) {}

  async execute(organizationId: string, name: string, dateStr: string, capacity: number, price: number): Promise<Event> {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
        throw new Error('Invalid Date format');
    }
    if (date < new Date()) {
        throw new Error('Event date must be in the future');
    }

    const event = new Event(
        uuidv4(),
        organizationId,
        name,
        date,
        capacity,
        price
    );

    await this.eventRepository.save(event);
    
    return event;
  }
}
