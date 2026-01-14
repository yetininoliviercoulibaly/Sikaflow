
import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IEventRepository, I_EVENT_REPOSITORY } from '../../domain/ports/event.repository.interface';

export interface EventStats {
  totalCapacity: number;
  soldCount: number;
  remainingCapacity: number;
  revenue: number;
}

@Injectable()
export class GetEventStatsUseCase {
  constructor(
    @Inject(I_EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,
  ) {}

  async execute(eventId: string): Promise<EventStats> {
    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return {
      totalCapacity: event.totalCapacity,
      soldCount: event.soldCount,
      remainingCapacity: event.getRemainingCapacity(),
      revenue: event.soldCount * event.price,
    };
  }
}
