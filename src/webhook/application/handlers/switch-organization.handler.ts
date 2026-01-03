import { Inject, Injectable, Logger } from '@nestjs/common';
import { IActionHandler, ActionContext, ACTION_HANDLER_TOKEN } from './action-handler.interface';
import { SwitchOrganizationUseCase } from '../../../organization/application/use-cases/switch-organization.use-case';
import { WhatsAppService } from '../../../common/whatsapp/whatsapp.service';
import { IOrganizationRepository, I_ORGANIZATION_REPOSITORY } from '../../../organization/domain/ports/organization.repository.interface';
import { IUserRepository, I_USER_REPOSITORY } from '../../../user/domain/ports/user.repository.interface';

@Injectable()
export class SwitchOrganizationHandler implements IActionHandler {
  private readonly logger = new Logger(SwitchOrganizationHandler.name);

  constructor(
      private readonly switchOrganizationUseCase: SwitchOrganizationUseCase,
      private readonly whatsAppService: WhatsAppService,
      @Inject(I_ORGANIZATION_REPOSITORY) private readonly organizationRepository: IOrganizationRepository,
      @Inject(I_USER_REPOSITORY) private readonly userRepository: IUserRepository,
  ) {}

  canHandle(intent: string): boolean {
    return intent === 'SWITCH_ORGANIZATION';
  }

  async handle(data: Record<string, any>, context: ActionContext): Promise<void> {
    const { senderPhoneNumber, missingFields } = context;
    const organizationName = data.organization_name;
    const targetOrganizationId = data.targetOrganizationId;

    const user = await this.userRepository.findByPhoneNumber(senderPhoneNumber);
    if (!user) return;

    // 1. Direct Switch via ID (Interactive Button)
    if (targetOrganizationId) {
        const result = await this.switchOrganizationUseCase.execute({
            userId: user.id,
            targetOrganizationId: targetOrganizationId
        });

        await this.whatsAppService.sendMessage(senderPhoneNumber, result.message);
        // Note: No fallback list needed here because the ID came from a valid list.
        return;
    }

    // 2. Direct Switch via Text (Name Parsing)
    if (organizationName) {
        const result = await this.switchOrganizationUseCase.execute({
            userId: user.id,
            targetOrganizationName: organizationName
        });

        await this.whatsAppService.sendMessage(senderPhoneNumber, result.message);

        if (!result.success) {
             await this.sendOrganizationList(senderPhoneNumber, user.id);
        }
        return;
    }

    // 3. No Name/ID provided -> Show List
    await this.sendOrganizationList(senderPhoneNumber, user.id);
  }

  private async sendOrganizationList(phoneNumber: string, userId: string): Promise<void> {
      const orgs = await this.organizationRepository.findOrganizationsForUser(userId);
      
      if (orgs.length === 0) {
          await this.whatsAppService.sendMessage(phoneNumber, "Vous n'êtes membre d'aucune organisation.");
          return;
      }

      const rows = orgs.map(org => ({
          id: `SWITCH_ORG_ID_${org.id}`,
          title: org.name.substring(0, 24), // Max 24 chars for title
          description: "Sélectionner"
      }));

      await this.whatsAppService.sendInteractiveList(
          phoneNumber,
          "Changer d'organisation",
          "Veuillez choisir votre contexte actif :",
          "Voir les Organisations",
          [{ title: "Mes Organisations", rows: rows }]
      );
  }
}
