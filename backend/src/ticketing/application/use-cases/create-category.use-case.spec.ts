
import { Test, TestingModule } from '@nestjs/testing';
import { CreateCategoryUseCase, CreateCategoryDto } from './create-category.use-case';
import { I_TICKET_CATEGORY_REPOSITORY } from '../../domain/ports/ticket-category.repository.interface';
import { I_EVENT_REPOSITORY } from '../../domain/ports/event.repository.interface';
import { TicketCategory } from '../../domain/ticket-category.entity';
import { NotFoundException } from '@nestjs/common';

describe('CreateCategoryUseCase', () => {
  let useCase: CreateCategoryUseCase;
  let categoryRepository: any;
  let eventRepository: any;

  beforeEach(async () => {
    categoryRepository = {
      save: jest.fn(),
      findByEventId: jest.fn(),
      unsetDefaultForEvent: jest.fn(),
    };
    eventRepository = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateCategoryUseCase,
        { provide: I_TICKET_CATEGORY_REPOSITORY, useValue: categoryRepository },
        { provide: I_EVENT_REPOSITORY, useValue: eventRepository },
      ],
    }).compile();

    useCase = module.get<CreateCategoryUseCase>(CreateCategoryUseCase);
  });

  it('should create a category successfully', async () => {
    eventRepository.findById.mockResolvedValue({ id: 'evt-1', organizationId: 'org-1' });
    const dto: CreateCategoryDto = {
      name: 'VIP',
      price: 5000,
      capacity: 100,
      benefits: ['Lounge'],
      isDefault: false,
    };

    const result = await useCase.execute('evt-1', dto, 'org-1');

    expect(result).toBeInstanceOf(TicketCategory);
    expect(result.name).toBe('VIP');
    expect(result.price).toBe(5000);
    expect(categoryRepository.save).toHaveBeenCalled();
  });

  it('should handle isDefault=true by unsetting others', async () => {
    eventRepository.findById.mockResolvedValue({ id: 'evt-1', organizationId: 'org-1' });
    const dto: CreateCategoryDto = {
      name: 'Standard',
      price: 1000,
      capacity: 500,
      isDefault: true,
    };

    await useCase.execute('evt-1', dto, 'org-1');

    expect(categoryRepository.unsetDefaultForEvent).toHaveBeenCalledWith('evt-1');
    expect(categoryRepository.save).toHaveBeenCalledWith(expect.objectContaining({ isDefault: true }));
  });

  it('should throw error if event does not exist', async () => {
    eventRepository.findById.mockResolvedValue(null);
    const dto: CreateCategoryDto = { name: 'VIP', price: 10, capacity: 10 };

    await expect(useCase.execute('bad-id', dto, 'org-1')).rejects.toThrow();
  });

  it('should throw error if user does not own event', async () => {
    eventRepository.findById.mockResolvedValue({ id: 'evt-1', organizationId: 'other-org' });
    const dto: CreateCategoryDto = { name: 'VIP', price: 10, capacity: 10 };

    await expect(useCase.execute('evt-1', dto, 'org-1')).rejects.toThrow('Forbidden');
  });
});
