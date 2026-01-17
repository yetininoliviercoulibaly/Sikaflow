
import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IActionHandler, ActionContext } from './action-handler.interface';
import { IOrganizationRepository, I_ORGANIZATION_REPOSITORY } from '../../../organization/domain/ports/organization.repository.interface';
import { OrganizationMember, UserRole } from '../../../organization/domain/organization-member.entity';
import { IUserRepository, I_USER_REPOSITORY } from '../../../user/domain/ports/user.repository.interface';
import { User } from '../../../user/domain/user.entity';
import { v4 as uuidv4 } from 'uuid';
import { LLMIntent } from '../../../common/llm/llm-types';

@Injectable()
export class AddMemberHandler implements IActionHandler {
    constructor(
        @Inject(I_ORGANIZATION_REPOSITORY) private readonly organizationRepository: IOrganizationRepository,
        @Inject(I_USER_REPOSITORY) private readonly userRepository: IUserRepository,
        private readonly eventEmitter: EventEmitter2,
    ) {}

    canHandle(intent: string): boolean {
        return intent === LLMIntent.ADD_MEMBER;
    }

    async handle(data: any, context: ActionContext): Promise<void> {
        const { senderPhoneNumber, organizationId, messagingService } = context;
        const targetPhone = data.phone_number;
        const targetRole = data.role as UserRole || UserRole.STAFF;

        if (!organizationId) {
             await messagingService.sendMessage(senderPhoneNumber, "Vous n'êtes connecté à aucune organisation.");
             return;
        }

        if (!targetPhone) {
             await messagingService.sendMessage(senderPhoneNumber, "Quel numéro voulez-vous ajouter ?");
             return;
        }

        // Check Permissions (Only Owner/Manager can add)
        const requestor = await this.userRepository.findByPhoneNumber(senderPhoneNumber);
        const requestorMember = await this.organizationRepository.findMember(organizationId, requestor!.id);

        if (!requestorMember || (requestorMember.role !== UserRole.OWNER && requestorMember.role !== UserRole.MANAGER)) {
             await messagingService.sendMessage(senderPhoneNumber, "⛔ Seuls les Managers et Propriétaires peuvent ajouter des membres.");
             return;
        }

        try {
            // Find or Create User
            let userToAdd = await this.userRepository.findByPhoneNumber(targetPhone);
            if (!userToAdd) {
                userToAdd = new User(uuidv4(), targetPhone, null, null, new Date());
                await this.userRepository.create(userToAdd);
            }

            // Check if already member
            const existingMember = await this.organizationRepository.findMember(organizationId, userToAdd.id);
            if (existingMember) {
                await messagingService.sendMessage(senderPhoneNumber, `⚠️ Ce numéro est déjà membre de l'équipe.`);
                return;
            }

            // Add Member via Repository directly
            const newMember = new OrganizationMember(organizationId, userToAdd.id, targetRole, new Date());
            await this.organizationRepository.addMember(newMember);

            // Emit Event for Onboarding
            this.eventEmitter.emit('member.added', {
                userId: requestor!.id,
                organizationId,
                senderPhoneNumber,
                platform: context.platform
            });

            await messagingService.sendMessage(
                senderPhoneNumber, 
                `✅ ${targetPhone} ajouté comme *${targetRole}* avec succès !`
            );

        } catch (error) {
             await messagingService.sendMessage(senderPhoneNumber, "Erreur lors de l'ajout du membre.");
             console.error(error);
        }
    }
}

