import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IUserRepository, I_USER_REPOSITORY } from '../../../user/domain/ports/user.repository.interface';
import { ResolveContextUseCase } from '../../../organization/application/use-cases/resolve-context.use-case';
import { IContactRepository, I_CONTACT_REPOSITORY } from '../../domain/ports/contact.repository.interface';
import { Contact } from '../../domain/contact.entity';

export interface GetDebtsListCommand {
  phoneNumber: string;
}

@Injectable()
export class GetDebtsListUseCase {
  constructor(
    @Inject(I_USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly resolveContextUseCase: ResolveContextUseCase,
    @Inject(I_CONTACT_REPOSITORY)
    private readonly contactRepository: IContactRepository,
  ) {}

  async execute(command: GetDebtsListCommand): Promise<Contact[]> {
    const { phoneNumber } = command;

    const user = await this.userRepository.findByPhoneNumber(phoneNumber);
    if (!user) {
      throw new NotFoundException(`User with phone ${phoneNumber} not found`);
    }

    const organization = await this.resolveContextUseCase.execute({ phoneNumber });

    return this.contactRepository.findWithPendingDebts(user.id, organization.id);
  }
}
