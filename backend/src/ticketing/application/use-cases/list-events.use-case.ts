
import { Injectable, Inject } from '@nestjs/common';
import { IEventRepository, I_EVENT_REPOSITORY } from '../../domain/ports/event.repository.interface';
import { Event } from '../../domain/event.entity';

@Injectable()
export class ListEventsUseCase {
  constructor(
    @Inject(I_EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,
  ) {}

  async execute(organizationId: string): Promise<Event[]> {
    return this.eventRepository.findByOrganizationId(organizationId);
  }
}
