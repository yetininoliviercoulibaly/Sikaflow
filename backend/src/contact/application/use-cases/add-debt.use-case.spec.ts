import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AddDebtUseCase } from './add-debt.use-case';
import { I_USER_REPOSITORY } from '../../../user/domain/ports/user.repository.interface';
import { ResolveContextUseCase } from '../../../organization/application/use-cases/resolve-context.use-case';
import { ContactService } from '../services/contact.service';
import { Contact } from '../../domain/contact.entity';

const makeContact = (totalOwed: number): Contact => {
  const c = new Contact('user-1', 'Kofi', { organizationId: 'org-1' });
  c.shortId = 'BC12AB';
  c.totalOwed = totalOwed;
  return c;
};

describe('AddDebtUseCase', () => {
  let useCase: AddDebtUseCase;
  let userRepository: { findByPhoneNumber: jest.Mock };
  let resolveContextUseCase: { execute: jest.Mock };
  let contactService: { addDebt: jest.Mock };

  beforeEach(async () => {
    userRepository = { findByPhoneNumber: jest.fn() };
    resolveContextUseCase = { execute: jest.fn() };
    contactService = { addDebt: jest.fn() };

    userRepository.findByPhoneNumber.mockResolvedValue({ id: 'user-1', phoneNumber: '+22507000000' });
    resolveContextUseCase.execute.mockResolvedValue({ id: 'org-1', name: 'Maquis Chez Omar' });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddDebtUseCase,
        { provide: I_USER_REPOSITORY, useValue: userRepository },
        { provide: ResolveContextUseCase, useValue: resolveContextUseCase },
        { provide: ContactService, useValue: contactService },
      ],
    }).compile();

    useCase = module.get<AddDebtUseCase>(AddDebtUseCase);
  });

  it('should record a debt for a new contact', async () => {
    const contact = makeContact(5000);
    contactService.addDebt.mockResolvedValue(contact);

    const result = await useCase.execute({
      phoneNumber: '+22507000000',
      amount: 5000,
      contactName: 'Kofi',
    });

    expect(contactService.addDebt).toHaveBeenCalledWith('user-1', 'org-1', {
      amount: 5000,
      contactName: 'Kofi',
      contactPhone: undefined,
      contactContext: undefined,
    });
    expect(result.totalOwed).toBe(5000);
    expect(result.shortId).toBe('BC12AB');
  });

  it('should accumulate totalOwed for existing contact', async () => {
    const contact = makeContact(10000); // 5000 existing + 5000 new
    contactService.addDebt.mockResolvedValue(contact);

    const result = await useCase.execute({
      phoneNumber: '+22507000000',
      amount: 5000,
      contactName: 'Kofi',
    });

    expect(result.totalOwed).toBe(10000);
  });

  it('should throw NotFoundException when user not found', async () => {
    userRepository.findByPhoneNumber.mockResolvedValue(null);

    await expect(
      useCase.execute({ phoneNumber: '+22500000000', amount: 5000, contactName: 'Kofi' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should propagate error from ContactService for invalid amount', async () => {
    contactService.addDebt.mockRejectedValue(new Error('Invalid amount: must be a positive number'));

    await expect(
      useCase.execute({ phoneNumber: '+22507000000', amount: -100, contactName: 'Kofi' }),
    ).rejects.toThrow('Invalid amount: must be a positive number');
  });
});
