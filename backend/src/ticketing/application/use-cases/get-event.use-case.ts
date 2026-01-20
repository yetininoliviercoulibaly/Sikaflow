import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IEventRepository, I_EVENT_REPOSITORY } from '../../domain/ports/event.repository.interface';
import { Event } from '../../domain/event.entity';

@Injectable()
export class GetEventUseCase {
  constructor(
    @Inject(I_EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,
  ) {}

  async execute(eventId: string, organizationId: string): Promise<Event> {
    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.organizationId !== organizationId) {
      throw new NotFoundException('Event not found'); // Use 404 to hide existence
    }

    return event;
  }
}
