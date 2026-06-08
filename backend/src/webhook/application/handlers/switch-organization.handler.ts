import { Inject, Injectable, Logger } from '@nestjs/common';
import { IActionHandler, ActionContext } from './action-handler.interface';
import { SwitchOrganizationUseCase } from '../../../organization/application/use-cases/switch-organization.use-case';
import { IOrganizationRepository, I_ORGANIZATION_REPOSITORY } from '../../../organization/domain/ports/organization.repository.interface';
import { IUserRepository, I_USER_REPOSITORY } from '../../../user/domain/ports/user.repository.interface';
import { IMessagingService } from '../../../common/messaging/messaging.service.interface';
import { LLMIntent } from '../../../common/llm/llm-types';

@Injectable()
export class SwitchOrganizationHandler implements IActionHandler {
  private readonly logger = new Logger(SwitchOrganizationHandler.name);

  constructor(
      private readonly switchOrganizationUseCase: SwitchOrganizationUseCase,
      @Inject(I_ORGANIZATION_REPOSITORY) private readonly organizationRepository: IOrganizationRepository,
      @Inject(I_USER_REPOSITORY) private readonly userRepository: IUserRepository,
  ) {}

  canHandle(intent: string): boolean {
    return intent === LLMIntent.SWITCH_ORGANIZATION;
  }

  async handle(data: Record<string, any>, context: ActionContext): Promise<void> {
    const { senderPhoneNumber, missingFields, messagingService } = context;
    const organizationName = data.organization_name;
    const targetOrganizationId = data.targetOrganizationId;

    const user = await this.userRepository.findByIdentifier(senderPhoneNumber);
    if (!user) return;

    // 1. Direct Switch via ID (Interactive Button)
    if (targetOrganizationId) {
        const result = await this.switchOrganizationUseCase.execute({
            userId: user.id,
            targetOrganizationId: targetOrganizationId
        });

        await messagingService.sendMessage(senderPhoneNumber, result.message);
        return;
    }

    // 2. Direct Switch via Text (Name Parsing)
    if (organizationName) {
        const result = await this.switchOrganizationUseCase.execute({
            userId: user.id,
            targetOrganizationName: organizationName
        });

        await messagingService.sendMessage(senderPhoneNumber, result.message);

        if (!result.success) {
             await this.sendOrganizationList(senderPhoneNumber, user.id, messagingService);
        }
        return;
    }

    // 3. No Name/ID provided -> Show List
    await this.sendOrganizationList(senderPhoneNumber, user.id, messagingService);
  }

  private async sendOrganizationList(phoneNumber: string, userId: string, messagingService: IMessagingService): Promise<void> {
      const orgs = await this.organizationRepository.findOrganizationsForUser(userId);
      
      if (orgs.length === 0) {
          await messagingService.sendMessage(phoneNumber, "Vous n'êtes membre d'aucune organisation.");
          return;
      }

      const rows = orgs.map(org => ({
          id: `SWITCH_ORG_ID_${org.id}`,
          title: org.name.substring(0, 24),
          description: "Sélectionner"
      }));

      await messagingService.sendInteractiveList(
          phoneNumber,
          "Changer d'organisation",
          "Veuillez choisir votre contexte actif :",
          "Voir les Organisations",
          [{ title: "Mes Organisations", rows: rows }]
      );
  }
}
