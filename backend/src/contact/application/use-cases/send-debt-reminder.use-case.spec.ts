import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SendDebtReminderUseCase } from './send-debt-reminder.use-case';
import { I_USER_REPOSITORY } from '../../../user/domain/ports/user.repository.interface';
import { I_CONTACT_REPOSITORY } from '../../domain/ports/contact.repository.interface';
import { I_MESSAGING_SERVICE } from '../../../common/messaging/messaging.service.interface';
import { Contact } from '../../domain/contact.entity';

const makeContact = (totalOwed: number, phone?: string): Contact => {
  const c = new Contact('user-1', 'Kofi', { organizationId: 'org-1' });
  c.shortId = 'BC12AB';
  c.totalOwed = totalOwed;
  c.phone = phone;
  return c;
};

describe('SendDebtReminderUseCase', () => {
  let useCase: SendDebtReminderUseCase;
  let userRepository: { findByPhoneNumber: jest.Mock; findByIdentifier: jest.Mock };
  let contactRepository: { findByShortId: jest.Mock };
  let messagingService: { sendMessage: jest.Mock };

  beforeEach(async () => {
    userRepository = { findByPhoneNumber: jest.fn(), findByIdentifier: jest.fn() };
    contactRepository = { findByShortId: jest.fn() };
    messagingService = { sendMessage: jest.fn() };

    userRepository.findByIdentifier.mockResolvedValue({ id: 'user-1', phoneNumber: '+22507000000' });
    messagingService.sendMessage.mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SendDebtReminderUseCase,
        { provide: I_USER_REPOSITORY, useValue: userRepository },
        { provide: I_CONTACT_REPOSITORY, useValue: contactRepository },
        { provide: I_MESSAGING_SERVICE, useValue: messagingService },
      ],
    }).compile();

    useCase = module.get<SendDebtReminderUseCase>(SendDebtReminderUseCase);
  });

  it('should send reminder and return messageSent=true when contact has a phone', async () => {
    contactRepository.findByShortId.mockResolvedValue(makeContact(5000, '+22508000000'));

    const result = await useCase.execute({ phoneNumber: '+22507000000', shortId: 'BC12AB' });

    expect(messagingService.sendMessage).toHaveBeenCalledWith('+22508000000', expect.stringContaining('Kofi'));
    expect(result.messageSent).toBe(true);
    expect(result.reminderText).toContain('Kofi');
    expect(result.reminderText).toContain('5');
  });

  it('should not send and return messageSent=false when contact has no phone', async () => {
    contactRepository.findByShortId.mockResolvedValue(makeContact(5000, undefined));

    const result = await useCase.execute({ phoneNumber: '+22507000000', shortId: 'BC12AB' });

    expect(messagingService.sendMessage).not.toHaveBeenCalled();
    expect(result.messageSent).toBe(false);
    expect(result.reminderText).toBeTruthy();
  });

  it('should throw NotFoundException when contact not found', async () => {
    contactRepository.findByShortId.mockResolvedValue(null);

    await expect(
      useCase.execute({ phoneNumber: '+22507000000', shortId: 'XXXXXX' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw NotFoundException when contact has no pending debt', async () => {
    contactRepository.findByShortId.mockResolvedValue(makeContact(0));

    await expect(
      useCase.execute({ phoneNumber: '+22507000000', shortId: 'BC12AB' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw NotFoundException when user not found', async () => {
    userRepository.findByIdentifier.mockResolvedValue(null);

    await expect(
      useCase.execute({ phoneNumber: '+22500000000', shortId: 'BC12AB' }),
    ).rejects.toThrow(NotFoundException);
  });
});
