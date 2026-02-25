import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IUserRepository, I_USER_REPOSITORY } from '../../../user/domain/ports/user.repository.interface';
import { ResolveContextUseCase } from '../../../organization/application/use-cases/resolve-context.use-case';
import { ContactService } from '../services/contact.service';
import { Contact } from '../../domain/contact.entity';

export interface AddDebtCommand {
  phoneNumber: string;
  amount: number;
  contactName: string;
  contactPhone?: string;
  description?: string;
}

@Injectable()
export class AddDebtUseCase {
  constructor(
    @Inject(I_USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly resolveContextUseCase: ResolveContextUseCase,
    private readonly contactService: ContactService,
  ) {}

  async execute(command: AddDebtCommand): Promise<Contact> {
    const { phoneNumber, amount, contactName, contactPhone, description } = command;

    const user = await this.userRepository.findByPhoneNumber(phoneNumber);
    if (!user) {
      throw new NotFoundException(`User with phone ${phoneNumber} not found`);
    }

    const organization = await this.resolveContextUseCase.execute({ phoneNumber });

    return this.contactService.addDebt(user.id, organization.id, {
      amount,
      contactName,
      contactPhone,
      contactContext: description,
    });
  }
}
