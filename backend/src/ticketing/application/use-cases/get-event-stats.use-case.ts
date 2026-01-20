
import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IEventRepository, I_EVENT_REPOSITORY } from '../../domain/ports/event.repository.interface';

export interface EventStats {
  totalCapacity: number;
  soldCount: number;
  remainingCapacity: number;
  revenue: number;
}

import { UserRole } from '../../../organization/domain/organization-member.entity';
import { I_PERMISSION_SERVICE, IPermissionService } from '../../domain/services/permission.service';

@Injectable()
export class GetEventStatsUseCase {
  constructor(
    @Inject(I_EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,
    @Inject(I_PERMISSION_SERVICE)
    private readonly permissionService: IPermissionService,
  ) {}

  async execute(eventId: string, organizationId: string, userRole?: UserRole): Promise<EventStats> {
    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    try {
      this.permissionService.verifyEventOwnership(event, organizationId, userRole);
    } catch (e) {
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
