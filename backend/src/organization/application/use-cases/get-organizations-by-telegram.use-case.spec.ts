import { Test, TestingModule } from '@nestjs/testing';
import { GetOrganizationsByTelegramUseCase } from './get-organizations-by-telegram.use-case';
import {
  I_ORGANIZATION_REPOSITORY,
  OrganizationWithRole,
} from '../../domain/ports/organization.repository.interface';
import { I_USER_REPOSITORY } from '../../../user/domain/ports/user.repository.interface';
import { User } from '../../../user/domain/user.entity';

describe('GetOrganizationsByTelegramUseCase', () => {
  let useCase: GetOrganizationsByTelegramUseCase;
  let userRepository: { findByTelegramUserId: jest.Mock };
  let organizationRepository: { findByPhoneNumber: jest.Mock };

  beforeEach(async () => {
    userRepository = {
      findByTelegramUserId: jest.fn(),
    };
    organizationRepository = {
      findByPhoneNumber: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetOrganizationsByTelegramUseCase,
        { provide: I_USER_REPOSITORY, useValue: userRepository },
        { provide: I_ORGANIZATION_REPOSITORY, useValue: organizationRepository },
      ],
    }).compile();

    useCase = module.get<GetOrganizationsByTelegramUseCase>(GetOrganizationsByTelegramUseCase);
  });

  it('should return null phone and empty orgs when Telegram user is unknown', async () => {
    userRepository.findByTelegramUserId.mockResolvedValue(null);

    const result = await useCase.execute({ telegramUserId: '999999' });

    expect(result).toEqual({ userPhoneNumber: null, organizations: [] });
    expect(userRepository.findByTelegramUserId).toHaveBeenCalledWith('999999');
    expect(organizationRepository.findByPhoneNumber).not.toHaveBeenCalled();
  });

  it('should return phone and organizations when Telegram user is known', async () => {
    const user = new User('user-1', '+22507000000', 'Kofi', null, new Date(), 'fr', '123456');
    const orgs: OrganizationWithRole[] = [
      { id: 'org-1', name: 'Maquis Chez Kofi', type: 'maquis', role: 'OWNER' },
    ];
    userRepository.findByTelegramUserId.mockResolvedValue(user);
    organizationRepository.findByPhoneNumber.mockResolvedValue(orgs);

    const result = await useCase.execute({ telegramUserId: '123456' });

    expect(result.userPhoneNumber).toBe('+22507000000');
    expect(result.organizations).toHaveLength(1);
    expect(result.organizations[0].name).toBe('Maquis Chez Kofi');
    expect(organizationRepository.findByPhoneNumber).toHaveBeenCalledWith('+22507000000');
  });

  it('should return phone and empty orgs when user exists but has no organizations', async () => {
    const user = new User('user-2', '+22507111111', null, null, new Date(), 'fr', '654321');
    userRepository.findByTelegramUserId.mockResolvedValue(user);
    organizationRepository.findByPhoneNumber.mockResolvedValue([]);

    const result = await useCase.execute({ telegramUserId: '654321' });

    expect(result.userPhoneNumber).toBe('+22507111111');
    expect(result.organizations).toEqual([]);
  });

  it('should return multiple organizations when user belongs to several', async () => {
    const user = new User('user-3', '+22507222222', 'Ama', null, new Date(), 'fr', '789012');
    const orgs: OrganizationWithRole[] = [
      { id: 'org-1', name: 'Maquis Chez Ama', type: 'maquis', role: 'OWNER' },
      { id: 'org-2', name: 'Festival Abidjan', type: 'evenementiel', role: 'MANAGER' },
    ];
    userRepository.findByTelegramUserId.mockResolvedValue(user);
    organizationRepository.findByPhoneNumber.mockResolvedValue(orgs);

    const result = await useCase.execute({ telegramUserId: '789012' });

    expect(result.organizations).toHaveLength(2);
    expect(result.organizations[1].role).toBe('MANAGER');
  });
});
