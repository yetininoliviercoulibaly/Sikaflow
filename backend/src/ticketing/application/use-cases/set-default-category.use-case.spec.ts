
import { Test, TestingModule } from '@nestjs/testing';
import { SetDefaultCategoryUseCase } from './set-default-category.use-case';
import { I_TICKET_CATEGORY_REPOSITORY } from '../../domain/ports/ticket-category.repository.interface';
import { TicketCategory } from '../../domain/ticket-category.entity';
import { I_EVENT_REPOSITORY } from '../../domain/ports/event.repository.interface';
import { UserRole } from '../../../organization/domain/organization-member.entity';

describe('SetDefaultCategoryUseCase', () => {
  let useCase: SetDefaultCategoryUseCase;
  let categoryRepository: any;
  let eventRepository: any;

  beforeEach(async () => {
    categoryRepository = {
      findById: jest.fn(),
      unsetDefaultForEvent: jest.fn(),
      update: jest.fn(),
      findByEventId: jest.fn(),
    };
    eventRepository = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SetDefaultCategoryUseCase,
        { provide: I_TICKET_CATEGORY_REPOSITORY, useValue: categoryRepository },
        { provide: I_EVENT_REPOSITORY, useValue: eventRepository },
      ],
    }).compile();

    useCase = module.get<SetDefaultCategoryUseCase>(SetDefaultCategoryUseCase);
  });

  it('should set category as default and unset others', async () => {
    const category = new TicketCategory('evt-1', 'VIP', 100, 100);
    category.id = 'cat-1';
    category.isDefault = false;

    categoryRepository.findById.mockResolvedValue(category);
    eventRepository.findById.mockResolvedValue({ id: 'evt-1', organizationId: 'org-1' });

    await useCase.execute('cat-1', 'org-1');

    expect(categoryRepository.unsetDefaultForEvent).toHaveBeenCalledWith('evt-1');
    expect(category.isDefault).toBe(true);
    expect(categoryRepository.update).toHaveBeenCalledWith(category);
  });

  it('should throw error if category not found', async () => {
    categoryRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('999', 'org-1')).rejects.toThrow('Category not found');
  });

  it('should throw error if event not found', async () => {
    const category = new TicketCategory('evt-1', 'VIP', 100, 100);
    categoryRepository.findById.mockResolvedValue(category);
    eventRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('cat-1', 'org-1')).rejects.toThrow('Event not found');
  });

  it('should throw error if user does not own event', async () => {
    const category = new TicketCategory('evt-1', 'VIP', 100, 100);
    categoryRepository.findById.mockResolvedValue(category);
    eventRepository.findById.mockResolvedValue({ id: 'evt-1', organizationId: 'other-org' });

    await expect(useCase.execute('cat-1', 'org-1')).rejects.toThrow('Forbidden');
  });

  it('should allow admin to set default even if org mismatch', async () => {
    const category = new TicketCategory('evt-1', 'VIP', 100, 100);
    category.id = 'cat-1';
    
    categoryRepository.findById.mockResolvedValue(category);
    eventRepository.findById.mockResolvedValue({ id: 'evt-1', organizationId: 'other-org' });

    await useCase.execute('cat-1', 'org-1', UserRole.ADMIN);

    expect(categoryRepository.unsetDefaultForEvent).toHaveBeenCalledWith('evt-1');
  });
});
