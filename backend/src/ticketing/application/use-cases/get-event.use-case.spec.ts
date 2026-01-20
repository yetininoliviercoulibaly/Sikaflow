
import { Test, TestingModule } from '@nestjs/testing';
import { GetEventUseCase } from './get-event.use-case';
import { I_EVENT_REPOSITORY } from '../../domain/ports/event.repository.interface';
import { Event } from '../../domain/event.entity';
import { NotFoundException } from '@nestjs/common';
import { UserRole } from '../../../organization/domain/organization-member.entity';

import { I_PERMISSION_SERVICE } from '../../domain/services/permission.service';

describe('GetEventUseCase', () => {
  let useCase: GetEventUseCase;
  let eventRepository: any;
  let permissionService: any;

  const mockEvent = new Event(
    '123',
    'org-1',
    'Test Event',
    new Date(),
    100, // totalCapacity
    1000 // price
  );

  beforeEach(async () => {
    eventRepository = {
      findById: jest.fn(),
    };
    permissionService = {
      verifyEventOwnership: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetEventUseCase,
        {
          provide: I_EVENT_REPOSITORY,
          useValue: eventRepository,
        },
        {
          provide: I_PERMISSION_SERVICE,
          useValue: permissionService,
        },
      ],
    }).compile();

    useCase = module.get<GetEventUseCase>(GetEventUseCase);
  });

  it('should return event details when found and owner matches', async () => {
    eventRepository.findById.mockResolvedValue(mockEvent);
    permissionService.verifyEventOwnership.mockImplementation(() => {});

    const result = await useCase.execute('123', 'org-1');
    expect(result).toBe(mockEvent);
    expect(eventRepository.findById).toHaveBeenCalledWith('123');
    expect(permissionService.verifyEventOwnership).toHaveBeenCalled();
  });

  it('should throw NotFoundException when event not found', async () => {
    eventRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('999', 'org-1')).rejects.toThrow(NotFoundException);
  });

  it('should throw NotFoundException when user does not own event', async () => {
    eventRepository.findById.mockResolvedValue(mockEvent);
    permissionService.verifyEventOwnership.mockImplementation(() => { throw new Error('Forbidden'); });

    await expect(useCase.execute('123', 'other-org')).rejects.toThrow(NotFoundException);
  });

  it('should return event for admin even if org mismatch', async () => {
    eventRepository.findById.mockResolvedValue(mockEvent);
    permissionService.verifyEventOwnership.mockImplementation(() => {});

    const result = await useCase.execute('123', 'other-org', UserRole.ADMIN);
    expect(result).toBe(mockEvent);
  });
});
