import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IUserRepository, I_USER_REPOSITORY } from '../../../user/domain/ports/user.repository.interface';
import { ResolveContextUseCase } from '../../../organization/application/use-cases/resolve-context.use-case';
import { ContactService } from '../services/contact.service';
import { Contact } from '../../domain/contact.entity';

export interface SettleDebtCommand {
  phoneNumber: string;
  shortId: string;
  amount?: number;
}

export interface SettleDebtResult {
  contact: Contact;
  settledAmount: number;
  remaining: number;
}

@Injectable()
export class SettleDebtUseCase {
  constructor(
    @Inject(I_USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly resolveContextUseCase: ResolveContextUseCase,
    private readonly contactService: ContactService,
  ) {}

  async execute(command: SettleDebtCommand): Promise<SettleDebtResult> {
    const { phoneNumber, shortId, amount } = command;

    const user = await this.userRepository.findByPhoneNumber(phoneNumber);
    if (!user) {
      throw new NotFoundException(`User with phone ${phoneNumber} not found`);
    }

    const organization = await this.resolveContextUseCase.execute({ phoneNumber });

    const result = await this.contactService.settleDebt(user.id, organization.id, {
      contactShortId: shortId,
      amount,
    });

    if (!result) {
      throw new NotFoundException(`Contact with shortId ${shortId} not found`);
    }

    return result;
  }
}
