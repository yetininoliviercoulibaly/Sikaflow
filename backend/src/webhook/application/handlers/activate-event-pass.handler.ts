import { Inject, Injectable, Logger } from '@nestjs/common';
import { IActionHandler, ActionContext } from './action-handler.interface';
import { ActivateEventPassUseCase } from '../../../subscription/application/use-cases/activate-event-pass.use-case';
import { IUserRepository, I_USER_REPOSITORY } from '../../../user/domain/ports/user.repository.interface';
import { LLMIntent } from '../../../common/llm/llm-types';

@Injectable()
export class ActivateEventPassHandler implements IActionHandler {
  private readonly logger = new Logger(ActivateEventPassHandler.name);

  constructor(
    private readonly activateEventPassUseCase: ActivateEventPassUseCase,
    @Inject(I_USER_REPOSITORY) private readonly userRepository: IUserRepository,
  ) {}

  canHandle(intent: string): boolean {
    return intent === LLMIntent.ACTIVATE_EVENT_PASS;
  }

  async handle(data: any, context: ActionContext): Promise<void> {
    const { senderPhoneNumber, messagingService } = context;

    // Resolve user and organization
    const user = await this.userRepository.findByPhoneNumber(senderPhoneNumber);
    if (!user || !user.lastActiveOrganizationId) {
      await messagingService.sendMessage(
        senderPhoneNumber,
        "❌ Veuillez d'abord sélectionner une organisation.",
      );
      return;
    }

    // Check if payment reference was provided (e.g., from interactive button or text)
    const paymentReference = data.payment_reference || data.reference;

    const result = await this.activateEventPassUseCase.execute({
      organizationId: user.lastActiveOrganizationId,
      paymentReference,
    });

    await messagingService.sendMessage(senderPhoneNumber, result.message);
  }
}
