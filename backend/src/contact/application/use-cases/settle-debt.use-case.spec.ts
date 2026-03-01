import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SettleDebtUseCase } from './settle-debt.use-case';
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

describe('SettleDebtUseCase', () => {
  let useCase: SettleDebtUseCase;
  let userRepository: { findByPhoneNumber: jest.Mock; findByIdentifier: jest.Mock };
  let resolveContextUseCase: { execute: jest.Mock };
  let contactService: { settleDebt: jest.Mock };

  beforeEach(async () => {
    userRepository = { findByPhoneNumber: jest.fn(), findByIdentifier: jest.fn() };
    resolveContextUseCase = { execute: jest.fn() };
    contactService = { settleDebt: jest.fn() };

    userRepository.findByIdentifier.mockResolvedValue({ id: 'user-1', phoneNumber: '+22507000000' });
    resolveContextUseCase.execute.mockResolvedValue({ id: 'org-1', name: 'Maquis Chez Omar' });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettleDebtUseCase,
        { provide: I_USER_REPOSITORY, useValue: userRepository },
        { provide: ResolveContextUseCase, useValue: resolveContextUseCase },
        { provide: ContactService, useValue: contactService },
      ],
    }).compile();

    useCase = module.get<SettleDebtUseCase>(SettleDebtUseCase);
  });

  it('should settle full debt when amount is not provided', async () => {
    const contact = makeContact(0);
    contactService.settleDebt.mockResolvedValue({ contact, settledAmount: 5000, remaining: 0 });

    const result = await useCase.execute({ phoneNumber: '+22507000000', shortId: 'BC12AB' });

    expect(contactService.settleDebt).toHaveBeenCalledWith('user-1', 'org-1', {
      contactShortId: 'BC12AB',
      amount: undefined,
    });
    expect(result.remaining).toBe(0);
    expect(result.settledAmount).toBe(5000);
  });

  it('should settle partial debt when amount is provided', async () => {
    const contact = makeContact(2000);
    contactService.settleDebt.mockResolvedValue({ contact, settledAmount: 3000, remaining: 2000 });

    const result = await useCase.execute({
      phoneNumber: '+22507000000',
      shortId: 'BC12AB',
      amount: 3000,
    });

    expect(contactService.settleDebt).toHaveBeenCalledWith('user-1', 'org-1', {
      contactShortId: 'BC12AB',
      amount: 3000,
    });
    expect(result.settledAmount).toBe(3000);
    expect(result.remaining).toBe(2000);
  });

  it('should throw NotFoundException when contact not found (settleDebt returns null)', async () => {
    contactService.settleDebt.mockResolvedValue(null);

    await expect(
      useCase.execute({ phoneNumber: '+22507000000', shortId: 'XXXXXX' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw NotFoundException when user not found', async () => {
    userRepository.findByIdentifier.mockResolvedValue(null);

    await expect(
      useCase.execute({ phoneNumber: '+22500000000', shortId: 'BC12AB' }),
    ).rejects.toThrow(NotFoundException);
  });
});
