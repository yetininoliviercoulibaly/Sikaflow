import { Test, TestingModule } from '@nestjs/testing';
import { GetOrganizationsByPhoneUseCase } from './get-organizations-by-phone.use-case';
import {
  I_ORGANIZATION_REPOSITORY,
  OrganizationWithRole,
} from '../../domain/ports/organization.repository.interface';

describe('GetOrganizationsByPhoneUseCase', () => {
  let useCase: GetOrganizationsByPhoneUseCase;
  let organizationRepository: { findByPhoneNumber: jest.Mock };

  beforeEach(async () => {
    organizationRepository = {
      findByPhoneNumber: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetOrganizationsByPhoneUseCase,
        { provide: I_ORGANIZATION_REPOSITORY, useValue: organizationRepository },
      ],
    }).compile();

    useCase = module.get<GetOrganizationsByPhoneUseCase>(GetOrganizationsByPhoneUseCase);
  });

  it('should return empty array when phone number is unknown', async () => {
    organizationRepository.findByPhoneNumber.mockResolvedValue([]);

    const result = await useCase.execute({ phoneNumber: '+22507000000' });

    expect(result).toEqual([]);
    expect(organizationRepository.findByPhoneNumber).toHaveBeenCalledWith('+22507000000');
  });

  it('should return organizations with roles when phone is known', async () => {
    const orgs: OrganizationWithRole[] = [
      { id: 'org-1', name: 'Maquis Chez Omar', role: 'OWNER' },
    ];
    organizationRepository.findByPhoneNumber.mockResolvedValue(orgs);

    const result = await useCase.execute({ phoneNumber: '+22507111111' });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ id: 'org-1', name: 'Maquis Chez Omar', role: 'OWNER' });
  });

  it('should return all organizations when user belongs to multiple', async () => {
    const orgs: OrganizationWithRole[] = [
      { id: 'org-1', name: 'Maquis Chez Omar', role: 'OWNER' },
      { id: 'org-2', name: 'Festival Abidjan', role: 'MANAGER' },
    ];
    organizationRepository.findByPhoneNumber.mockResolvedValue(orgs);

    const result = await useCase.execute({ phoneNumber: '+22507222222' });

    expect(result).toHaveLength(2);
    expect(result[1].role).toBe('MANAGER');
  });
});
