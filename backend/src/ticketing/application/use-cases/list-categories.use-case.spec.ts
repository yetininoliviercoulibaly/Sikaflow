
import { Test, TestingModule } from '@nestjs/testing';
import { ListCategoriesUseCase } from './list-categories.use-case';
import { I_TICKET_CATEGORY_REPOSITORY } from '../../domain/ports/ticket-category.repository.interface';
import { I_EVENT_REPOSITORY } from '../../domain/ports/event.repository.interface';
import { TicketCategory } from '../../domain/ticket-category.entity';
import { UserRole } from '../../../organization/domain/organization-member.entity';

import { I_PERMISSION_SERVICE } from '../../domain/services/permission.service';

describe('ListCategoriesUseCase', () => {
  let useCase: ListCategoriesUseCase;
  let categoryRepository: any;
  let eventRepository: any;
  let permissionService: any;

  beforeEach(async () => {
    categoryRepository = {
      findByEventId: jest.fn(),
    };
    eventRepository = {
      findById: jest.fn(),
    };
    permissionService = {
      verifyEventOwnership: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListCategoriesUseCase,
        { provide: I_TICKET_CATEGORY_REPOSITORY, useValue: categoryRepository },
        { provide: I_EVENT_REPOSITORY, useValue: eventRepository },
        { provide: I_PERMISSION_SERVICE, useValue: permissionService },
      ],
    }).compile();

    useCase = module.get<ListCategoriesUseCase>(ListCategoriesUseCase);
  });

  it('should list categories when event exists and user owns it', async () => {
    const categories = [new TicketCategory('evt-1', 'VIP', 100, 100)];
    eventRepository.findById.mockResolvedValue({ id: 'evt-1', organizationId: 'org-1' });
    categoryRepository.findByEventId.mockResolvedValue(categories);
    permissionService.verifyEventOwnership.mockImplementation(() => {});

    const result = await useCase.execute('evt-1', 'org-1');

    expect(result).toBe(categories);
    expect(eventRepository.findById).toHaveBeenCalledWith('evt-1');
    expect(permissionService.verifyEventOwnership).toHaveBeenCalled();
  });

  it('should throw error if event not found', async () => {
    eventRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('999', 'org-1')).rejects.toThrow('Event not found');
  });

  it('should throw forbidden error if organization does not match', async () => {
    eventRepository.findById.mockResolvedValue({ id: 'evt-1', organizationId: 'other-org' });
    permissionService.verifyEventOwnership.mockImplementation(() => { throw new Error('Forbidden'); });

    await expect(useCase.execute('evt-1', 'org-1')).rejects.toThrow('Forbidden');
  });

  it('should list categories for admin even if org mismatch', async () => {
    const categories = [new TicketCategory('evt-1', 'VIP', 100, 100)];
    eventRepository.findById.mockResolvedValue({ id: 'evt-1', organizationId: 'other-org' });
    permissionService.verifyEventOwnership.mockImplementation(() => {});
    categoryRepository.findByEventId.mockResolvedValue(categories);

    const result = await useCase.execute('evt-1', 'org-1', UserRole.ADMIN);
    expect(result).toBe(categories);
  });
});
