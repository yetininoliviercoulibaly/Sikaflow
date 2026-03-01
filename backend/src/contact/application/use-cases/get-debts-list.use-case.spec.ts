import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetDebtsListUseCase } from './get-debts-list.use-case';
import { I_USER_REPOSITORY } from '../../../user/domain/ports/user.repository.interface';
import { I_CONTACT_REPOSITORY } from '../../domain/ports/contact.repository.interface';
import { ResolveContextUseCase } from '../../../organization/application/use-cases/resolve-context.use-case';
import { Contact } from '../../domain/contact.entity';

const makeContact = (name: string, totalOwed: number): Contact => {
  const c = new Contact('user-1', name, { organizationId: 'org-1' });
  c.totalOwed = totalOwed;
  return c;
};

describe('GetDebtsListUseCase', () => {
  let useCase: GetDebtsListUseCase;
  let userRepository: { findByPhoneNumber: jest.Mock; findByIdentifier: jest.Mock };
  let resolveContextUseCase: { execute: jest.Mock };
  let contactRepository: { findWithPendingDebts: jest.Mock };

  beforeEach(async () => {
    userRepository = { findByPhoneNumber: jest.fn(), findByIdentifier: jest.fn() };
    resolveContextUseCase = { execute: jest.fn() };
    contactRepository = { findWithPendingDebts: jest.fn() };

    userRepository.findByIdentifier.mockResolvedValue({ id: 'user-1', phoneNumber: '+22507000000' });
    resolveContextUseCase.execute.mockResolvedValue({ id: 'org-1', name: 'Maquis Chez Omar' });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetDebtsListUseCase,
        { provide: I_USER_REPOSITORY, useValue: userRepository },
        { provide: I_CONTACT_REPOSITORY, useValue: contactRepository },
        { provide: ResolveContextUseCase, useValue: resolveContextUseCase },
      ],
    }).compile();

    useCase = module.get<GetDebtsListUseCase>(GetDebtsListUseCase);
  });

  it('should return list of contacts with pending debts', async () => {
    const contacts = [
      makeContact('Kofi', 5000),
      makeContact('Bakary', 25000),
    ];
    contactRepository.findWithPendingDebts.mockResolvedValue(contacts);

    const result = await useCase.execute({ phoneNumber: '+22507000000' });

    expect(contactRepository.findWithPendingDebts).toHaveBeenCalledWith('user-1', 'org-1');
    expect(result).toHaveLength(2);
    expect(result[0].totalOwed).toBe(5000);
    expect(result[1].totalOwed).toBe(25000);
  });

  it('should return empty array when no pending debts', async () => {
    contactRepository.findWithPendingDebts.mockResolvedValue([]);

    const result = await useCase.execute({ phoneNumber: '+22507000000' });

    expect(result).toEqual([]);
  });

  it('should throw NotFoundException when user not found', async () => {
    userRepository.findByIdentifier.mockResolvedValue(null);

    await expect(
      useCase.execute({ phoneNumber: '+22500000000' }),
    ).rejects.toThrow(NotFoundException);
  });
});
