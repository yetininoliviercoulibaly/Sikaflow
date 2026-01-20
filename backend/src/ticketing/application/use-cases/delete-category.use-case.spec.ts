
import { Test, TestingModule } from '@nestjs/testing';
import { DeleteCategoryUseCase } from './delete-category.use-case';
import { I_TICKET_CATEGORY_REPOSITORY } from '../../domain/ports/ticket-category.repository.interface';
import { I_EVENT_REPOSITORY } from '../../domain/ports/event.repository.interface';
import { I_PERMISSION_SERVICE } from '../../domain/services/permission.service';
import { TicketCategory } from '../../domain/ticket-category.entity';
import { UserRole } from '../../../organization/domain/organization-member.entity';

describe('DeleteCategoryUseCase', () => {
  let useCase: DeleteCategoryUseCase;
  let categoryRepository: any;
  let eventRepository: any;
  let permissionService: any;

  beforeEach(async () => {
    categoryRepository = {
      findById: jest.fn(),
      delete: jest.fn(),
    };
    eventRepository = {
      findById: jest.fn(),
    };
    permissionService = {
      verifyEventOwnership: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteCategoryUseCase,
        { provide: I_TICKET_CATEGORY_REPOSITORY, useValue: categoryRepository },
        { provide: I_EVENT_REPOSITORY, useValue: eventRepository },
        { provide: I_PERMISSION_SERVICE, useValue: permissionService },
      ],
    }).compile();

    useCase = module.get<DeleteCategoryUseCase>(DeleteCategoryUseCase);
  });

  it('should delete category when found and user owns event', async () => {
    const category = new TicketCategory('evt-1', 'VIP', 100, 100);
    category.id = 'cat-1';
    
    categoryRepository.findById.mockResolvedValue(category);
    eventRepository.findById.mockResolvedValue({ id: 'evt-1', organizationId: 'org-1' });
    permissionService.verifyEventOwnership.mockImplementation(() => {});

    await useCase.execute('cat-1', 'org-1');

    expect(categoryRepository.delete).toHaveBeenCalledWith('cat-1');
    expect(permissionService.verifyEventOwnership).toHaveBeenCalled();
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
    permissionService.verifyEventOwnership.mockImplementation(() => { throw new Error('Forbidden'); });

    await expect(useCase.execute('cat-1', 'org-1')).rejects.toThrow('Forbidden');
  });

  it('should allow admin to delete category even if org mismatch', async () => {
    const category = new TicketCategory('evt-1', 'VIP', 100, 100);
    category.id = 'cat-1';
    
    categoryRepository.findById.mockResolvedValue(category);
    eventRepository.findById.mockResolvedValue({ id: 'evt-1', organizationId: 'other-org' });
    permissionService.verifyEventOwnership.mockImplementation(() => {});

    await useCase.execute('cat-1', 'org-1', UserRole.ADMIN);

    expect(categoryRepository.delete).toHaveBeenCalledWith('cat-1');
  });

  it('should throw error if tickets are already sold', async () => {
    const category = new TicketCategory('evt-1', 'VIP', 100, 100);
    category.id = 'cat-1';
    category.soldCount = 5; // Simulating sold tickets
    
    categoryRepository.findById.mockResolvedValue(category);
    eventRepository.findById.mockResolvedValue({ id: 'evt-1', organizationId: 'org-1' });
    permissionService.verifyEventOwnership.mockImplementation(() => {});

    await expect(useCase.execute('cat-1', 'org-1')).rejects.toThrow("Cannot delete category 'VIP': 5 tickets already sold");
  });
});
