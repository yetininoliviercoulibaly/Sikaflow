
import { Test, TestingModule } from '@nestjs/testing';
import { UpdateCategoryUseCase } from './update-category.use-case';
import { I_TICKET_CATEGORY_REPOSITORY } from '../../domain/ports/ticket-category.repository.interface';
import { I_EVENT_REPOSITORY } from '../../domain/ports/event.repository.interface';
import { I_PERMISSION_SERVICE } from '../../domain/services/permission.service';
import { TicketCategory } from '../../domain/ticket-category.entity';
import { UserRole } from '../../../organization/domain/organization-member.entity';

describe('UpdateCategoryUseCase', () => {
  let useCase: UpdateCategoryUseCase;
  let categoryRepository: any;
  let eventRepository: any;
  let permissionService: any;

  beforeEach(async () => {
    categoryRepository = {
      findById: jest.fn(),
      update: jest.fn(),
    };
    eventRepository = {
      findById: jest.fn(),
    };
    permissionService = {
      verifyEventOwnership: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateCategoryUseCase,
        { provide: I_TICKET_CATEGORY_REPOSITORY, useValue: categoryRepository },
        { provide: I_EVENT_REPOSITORY, useValue: eventRepository },
        { provide: I_PERMISSION_SERVICE, useValue: permissionService },
      ],
    }).compile();

    useCase = module.get<UpdateCategoryUseCase>(UpdateCategoryUseCase);
  });

  it('should update category when found and user owns event', async () => {
    const category = new TicketCategory('evt-1', 'VIP', 100, 100);
    category.id = 'cat-1';
    
    categoryRepository.findById.mockResolvedValue(category);
    eventRepository.findById.mockResolvedValue({ id: 'evt-1', organizationId: 'org-1' });
    permissionService.verifyEventOwnership.mockImplementation(() => {});

    await useCase.execute('cat-1', { name: 'Super VIP', price: 150 }, 'org-1');

    expect(category.name).toBe('Super VIP');
    expect(category.price).toBe(150);
    expect(categoryRepository.update).toHaveBeenCalledWith(category);
    expect(permissionService.verifyEventOwnership).toHaveBeenCalled();
  });

  it('should throw error if category not found', async () => {
    categoryRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('999', {}, 'org-1')).rejects.toThrow('Category not found');
  });

  it('should throw error if event not found', async () => {
    const category = new TicketCategory('evt-1', 'VIP', 100, 100);
    categoryRepository.findById.mockResolvedValue(category);
    eventRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('cat-1', {}, 'org-1')).rejects.toThrow('Event not found');
  });

  it('should throw error if user does not own event', async () => {
    const category = new TicketCategory('evt-1', 'VIP', 100, 100);
    categoryRepository.findById.mockResolvedValue(category);
    eventRepository.findById.mockResolvedValue({ id: 'evt-1', organizationId: 'other-org' });
    permissionService.verifyEventOwnership.mockImplementation(() => { throw new Error('Forbidden'); });

    await expect(useCase.execute('cat-1', {}, 'org-1')).rejects.toThrow('Forbidden');
  });

  it('should allow admin to update category even if org mismatch', async () => {
    const category = new TicketCategory('evt-1', 'VIP', 100, 100);
    category.id = 'cat-1';
    
    categoryRepository.findById.mockResolvedValue(category);
    eventRepository.findById.mockResolvedValue({ id: 'evt-1', organizationId: 'other-org' });
    permissionService.verifyEventOwnership.mockImplementation(() => {});

    await useCase.execute('cat-1', { name: 'Admin VIP' }, 'org-1', UserRole.ADMIN);

    expect(category.name).toBe('Admin VIP');
    expect(categoryRepository.update).toHaveBeenCalledWith(category);
  });
});
