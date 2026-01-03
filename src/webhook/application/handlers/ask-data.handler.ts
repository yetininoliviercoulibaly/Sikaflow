import { Inject, Injectable } from '@nestjs/common';
import { IActionHandler, ActionContext } from './action-handler.interface';
import { BusinessIntelligenceService } from '../../../report/application/services/business-intelligence.service';
import { WhatsAppService } from '../../../common/whatsapp/whatsapp.service';
import { IUserRepository, I_USER_REPOSITORY } from '../../../user/domain/ports/user.repository.interface';
import { IOrganizationRepository, I_ORGANIZATION_REPOSITORY } from '../../../organization/domain/ports/organization.repository.interface';
import { UserRole } from '../../../organization/domain/organization-member.entity';

@Injectable()
export class AskDataHandler implements IActionHandler {
    constructor(
        private readonly biService: BusinessIntelligenceService,
        private readonly whatsAppService: WhatsAppService,
        @Inject(I_USER_REPOSITORY) private readonly userRepository: IUserRepository,
        @Inject(I_ORGANIZATION_REPOSITORY) private readonly organizationRepository: IOrganizationRepository,
    ) {}

    canHandle(intent: string): boolean {
        return intent === 'ASK_DATA';
    }

     async handle(data: any, context: ActionContext): Promise<void> {
          const metric = data.metric;
          const period = data.period;
          const date = data.date;
          
          if (!metric) {
              await this.whatsAppService.sendMessage(context.senderPhoneNumber, "Je n'ai pas compris quelle donnée vous cherchez.");
              return;
          }

          // Resolve User and Role
          const user = await this.userRepository.findByPhoneNumber(context.senderPhoneNumber);
          if (!user) {
              await this.whatsAppService.sendMessage(context.senderPhoneNumber, "Utilisateur non trouvé.");
              return;
          }

          let userRole: UserRole | undefined = undefined;
          let organizationId: string | undefined = undefined;

          if (user.lastActiveOrganizationId) {
              organizationId = user.lastActiveOrganizationId;
              const member = await this.organizationRepository.findMember(organizationId, user.id);
              userRole = member?.role;
          }

          // US.10: Pass user role to BI Service for access control
          const answer = await this.biService.getMetric(organizationId, metric, period, date, userRole);
          await this.whatsAppService.sendMessage(context.senderPhoneNumber, answer);
     }
}

