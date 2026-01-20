
import { Test, TestingModule } from '@nestjs/testing';
import { SetDefaultCategoryUseCase } from './set-default-category.use-case';
import { I_TICKET_CATEGORY_REPOSITORY } from '../../domain/ports/ticket-category.repository.interface';
import { TicketCategory } from '../../domain/ticket-category.entity';

describe('SetDefaultCategoryUseCase', () => {
  let useCase: SetDefaultCategoryUseCase;
  let categoryRepository: any;

  beforeEach(async () => {
    categoryRepository = {
      findById: jest.fn(),
      unsetDefaultForEvent: jest.fn(),
      update: jest.fn(),
      findByEventId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SetDefaultCategoryUseCase,
        { provide: I_TICKET_CATEGORY_REPOSITORY, useValue: categoryRepository },
      ],
    }).compile();

    useCase = module.get<SetDefaultCategoryUseCase>(SetDefaultCategoryUseCase);
  });

  it('should set category as default and unset others', async () => {
    const category = new TicketCategory('evt-1', 'VIP', 100, 100);
    category.id = 'cat-1';
    category.isDefault = false;

    categoryRepository.findById.mockResolvedValue(category);

    await useCase.execute('cat-1');

    expect(categoryRepository.unsetDefaultForEvent).toHaveBeenCalledWith('evt-1');
    expect(category.isDefault).toBe(true);
    expect(categoryRepository.update).toHaveBeenCalledWith(category);
  });

  it('should throw error if category not found', async () => {
    categoryRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('999')).rejects.toThrow('Category not found');
  });
});
