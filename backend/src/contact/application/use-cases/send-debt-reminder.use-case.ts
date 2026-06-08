import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IUserRepository, I_USER_REPOSITORY } from '../../../user/domain/ports/user.repository.interface';
import { IContactRepository, I_CONTACT_REPOSITORY } from '../../domain/ports/contact.repository.interface';
import { IMessagingService, I_MESSAGING_SERVICE } from '../../../common/messaging/messaging.service.interface';
import { Contact } from '../../domain/contact.entity';

export interface SendDebtReminderCommand {
  phoneNumber: string;
  shortId: string;
}

export interface SendDebtReminderResult {
  contact: Contact;
  messageSent: boolean;
  reminderText: string;
}

@Injectable()
export class SendDebtReminderUseCase {
  constructor(
    @Inject(I_USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(I_CONTACT_REPOSITORY)
    private readonly contactRepository: IContactRepository,
    @Inject(I_MESSAGING_SERVICE)
    private readonly messagingService: IMessagingService,
  ) {}

  async execute(command: SendDebtReminderCommand): Promise<SendDebtReminderResult> {
    const { phoneNumber, shortId } = command;

    const user = await this.userRepository.findByIdentifier(phoneNumber);
    if (!user) {
      throw new NotFoundException(`User with phone ${phoneNumber} not found`);
    }

    const contact = await this.contactRepository.findByShortId(user.id, shortId);
    if (!contact) {
      throw new NotFoundException(`Contact with shortId ${shortId} not found`);
    }

    if (contact.totalOwed <= 0) {
      throw new NotFoundException(`Contact ${contact.displayName} has no pending debt`);
    }

    const reminderText = `👋 Bonjour ${contact.displayName}, ceci est un rappel concernant une dette de ${contact.totalOwed.toLocaleString('fr-FR')} FCFA. Merci de régulariser dès que possible ! 🙏`;

    if (contact.phone) {
      await this.messagingService.sendMessage(contact.phone, reminderText);
      return { contact, messageSent: true, reminderText };
    }

    return { contact, messageSent: false, reminderText };
  }
}
