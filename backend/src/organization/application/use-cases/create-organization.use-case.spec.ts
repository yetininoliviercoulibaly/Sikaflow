jest.mock('uuid', () => ({
  v4: () => 'mock-uuid',
}));

import { Test, TestingModule } from '@nestjs/testing';
import { CreateOrganizationUseCase } from './create-organization.use-case';
import { I_ORGANIZATION_REPOSITORY } from '../../domain/ports/organization.repository.interface';
import { I_USER_REPOSITORY } from '../../../user/domain/ports/user.repository.interface';
import { User } from '../../../user/domain/user.entity';
import { ConflictException } from '@nestjs/common';

describe('CreateOrganizationUseCase', () => {
  let useCase: CreateOrganizationUseCase;
  let userRepository: any;
  let organizationRepository: any;

  beforeEach(async () => {
    userRepository = {
      findById: jest.fn(),
      findByPhoneNumber: jest.fn(),
      findByTelegramUserId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };
    organizationRepository = {
      create: jest.fn(),
      addMember: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateOrganizationUseCase,
        { provide: I_USER_REPOSITORY, useValue: userRepository },
        { provide: I_ORGANIZATION_REPOSITORY, useValue: organizationRepository },
      ],
    }).compile();

    useCase = module.get<CreateOrganizationUseCase>(CreateOrganizationUseCase);
  });

  it('should create organization with existing ownerId', async () => {
    const ownerId = 'existing-owner-id';
    userRepository.findById.mockResolvedValue({ id: ownerId } as User);

    const result = await useCase.execute({ ownerId, name: 'Test Org' });

    expect(result).toBeDefined();
    expect(userRepository.findById).toHaveBeenCalledWith(ownerId);
    expect(organizationRepository.create).toHaveBeenCalled();
  });

  it('should auto-create user and organization if ownerId is missing but phone is provided', async () => {
    const phoneNumber = '+1234567890';
    userRepository.findById.mockResolvedValue(null);
    userRepository.findByPhoneNumber.mockResolvedValue(null);
    userRepository.create.mockImplementation((u: Partial<User>) => Promise.resolve({ ...u, id: 'new-user-id' }));

    const result = await useCase.execute({ name: 'Auto Org', userPhoneNumber: phoneNumber });

    expect(result).toBeDefined();
    expect(userRepository.create).toHaveBeenCalled(); // Should assume user creation
    expect(organizationRepository.create).toHaveBeenCalled();
    expect(organizationRepository.addMember).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'new-user-id', role: 'OWNER' })
    );
  });

  it('should use existing user found by phone if ownerId not provided', async () => {
    const phoneNumber = '+1234567890';
    userRepository.findById.mockResolvedValue(null);
    userRepository.findByPhoneNumber.mockResolvedValue({ id: 'found-user-id' });

    const result = await useCase.execute({ name: 'Phone Org', userPhoneNumber: phoneNumber });

    expect(result).toBeDefined();
    expect(userRepository.create).not.toHaveBeenCalled();
    expect(organizationRepository.create).toHaveBeenCalled();
    expect(organizationRepository.addMember).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'found-user-id', role: 'OWNER' })
    );
  });

  it('should store businessType in settings when provided', async () => {
    const ownerId = 'existing-owner-id';
    userRepository.findById.mockResolvedValue({ id: ownerId, lastActiveOrganizationId: null } as User);
    organizationRepository.create.mockImplementation((org: any) => Promise.resolve(org));

    const result = await useCase.execute({ ownerId, name: 'Maquis Chez Omar', businessType: 'maquis' });

    expect(organizationRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        settings: expect.objectContaining({ businessType: 'maquis' }),
      }),
    );
  });

  it('should create organization normally when businessType is absent', async () => {
    const ownerId = 'existing-owner-id';
    userRepository.findById.mockResolvedValue({ id: ownerId, lastActiveOrganizationId: null } as User);
    organizationRepository.create.mockImplementation((org: any) => Promise.resolve(org));

    const result = await useCase.execute({ ownerId, name: 'Mon Business' });

    expect(organizationRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        settings: expect.not.objectContaining({ businessType: expect.anything() }),
      }),
    );
  });

  it('should find user by telegramUserId when ownerId not found', async () => {
    userRepository.findById.mockResolvedValue(null);
    userRepository.findByTelegramUserId.mockResolvedValue({ id: 'tg-user-id', phoneNumber: '+22507000000', telegramUserId: '123456' } as User);

    const result = await useCase.execute({ name: 'Telegram Org', userPhoneNumber: '+22507000000', telegramUserId: '123456' });

    expect(result).toBeDefined();
    expect(userRepository.findByTelegramUserId).toHaveBeenCalledWith('123456');
    expect(userRepository.findByPhoneNumber).not.toHaveBeenCalled();
    expect(organizationRepository.create).toHaveBeenCalled();
  });

  it('should store telegramUserId when creating a new user', async () => {
    userRepository.findById.mockResolvedValue(null);
    userRepository.findByTelegramUserId.mockResolvedValue(null);
    userRepository.findByPhoneNumber.mockResolvedValue(null);
    userRepository.create.mockImplementation((u: Partial<User>) => Promise.resolve({ ...u, id: 'mock-uuid' }));

    await useCase.execute({ name: 'New TG Org', userPhoneNumber: '+22507111111', telegramUserId: '999888' });

    expect(userRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ telegramUserId: '999888', phoneNumber: '+22507111111' }),
    );
  });

  it('should link telegramUserId to existing user found by phone (cross-platform)', async () => {
    const existingUser = { id: 'phone-user-id', phoneNumber: '+22507222222', telegramUserId: null } as User;
    userRepository.findById.mockResolvedValue(null);
    userRepository.findByTelegramUserId.mockResolvedValue(null);
    userRepository.findByPhoneNumber.mockResolvedValue(existingUser);

    await useCase.execute({ name: 'Cross Org', userPhoneNumber: '+22507222222', telegramUserId: '777666' });

    expect(userRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({ telegramUserId: '777666' }),
    );
  });

  it('should throw when telegramUserId is already linked to another user', async () => {
    const existingUser = { id: 'phone-user-id', phoneNumber: '+22507333333', telegramUserId: null } as User;
    const otherTgUser = { id: 'other-user-id', phoneNumber: '+22507444444', telegramUserId: '555444' } as User;
    userRepository.findById.mockResolvedValue(null);
    userRepository.findByTelegramUserId
      .mockResolvedValueOnce(null)  // first call in lookup chain
      .mockResolvedValueOnce(otherTgUser);  // second call in linkage check
    userRepository.findByPhoneNumber.mockResolvedValue(existingUser);

    await expect(
      useCase.execute({ name: 'Conflict Org', userPhoneNumber: '+22507333333', telegramUserId: '555444' }),
    ).rejects.toThrow(ConflictException);
  });
});
