
import { Test, TestingModule } from '@nestjs/testing';
import { GetEventStatsUseCase } from './get-event-stats.use-case';
import { I_EVENT_REPOSITORY } from '../../domain/ports/event.repository.interface';
import { NotFoundException } from '@nestjs/common';
import { UserRole } from '../../../organization/domain/organization-member.entity';

import { I_PERMISSION_SERVICE } from '../../domain/services/permission.service';

describe('GetEventStatsUseCase', () => {
  let useCase: GetEventStatsUseCase;
  let eventRepository: any;
  let permissionService: any;

  const mockEvent = {
    id: 'evt-1',
    organizationId: 'org-1',
    totalCapacity: 100,
    soldCount: 20,
    price: 50,
    getRemainingCapacity: jest.fn().mockReturnValue(80),
  };

  beforeEach(async () => {
    eventRepository = {
      findById: jest.fn(),
    };
    permissionService = {
      verifyEventOwnership: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetEventStatsUseCase,
        { provide: I_EVENT_REPOSITORY, useValue: eventRepository },
        { provide: I_PERMISSION_SERVICE, useValue: permissionService },
      ],
    }).compile();

    useCase = module.get<GetEventStatsUseCase>(GetEventStatsUseCase);
  });

  it('should return stats when event found and user owns it', async () => {
    eventRepository.findById.mockResolvedValue(mockEvent);
    permissionService.verifyEventOwnership.mockImplementation(() => {});

    const result = await useCase.execute('evt-1', 'org-1');

    expect(result).toEqual({
      totalCapacity: 100,
      soldCount: 20,
      remainingCapacity: 80,
      revenue: 1000,
    });
    expect(permissionService.verifyEventOwnership).toHaveBeenCalled();
  });

  it('should throw NotFoundException if event not found', async () => {
    eventRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('999', 'org-1')).rejects.toThrow(NotFoundException);
  });

  it('should throw NotFoundException if user does not own event (hiding existence)', async () => {
    eventRepository.findById.mockResolvedValue(mockEvent);
    permissionService.verifyEventOwnership.mockImplementation(() => { throw new Error('Forbidden'); });

    await expect(useCase.execute('evt-1', 'other-org')).rejects.toThrow(NotFoundException);
  });

  it('should return stats for admin even if org mismatch', async () => {
    eventRepository.findById.mockResolvedValue(mockEvent);
    permissionService.verifyEventOwnership.mockImplementation(() => {});

    const result = await useCase.execute('evt-1', 'other-org', UserRole.ADMIN);
    expect(result).toBeDefined();
    expect(result.revenue).toBe(1000);
  });
});
