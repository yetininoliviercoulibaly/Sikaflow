import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IActionHandler, ActionContext } from './action-handler.interface';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { IUserRepository, I_USER_REPOSITORY } from '../../../user/domain/ports/user.repository.interface';
import { Inject } from '@nestjs/common';
import { CheckFeatureUseCase } from '../../../subscription/application/use-cases/check-feature.use-case';
import { FeatureFlag } from '../../../subscription/domain/feature-flag.enum';
import { LLMIntent } from '../../../common/llm/llm-types';

@Injectable()
export class GenerateReportHandler implements IActionHandler {
    constructor(
        @InjectQueue('reports') private readonly reportsQueue: Queue,
        private readonly eventEmitter: EventEmitter2,
        @Inject(I_USER_REPOSITORY) private readonly userRepository: IUserRepository,
        private readonly checkFeatureUseCase: CheckFeatureUseCase,
    ) {}

    canHandle(intent: string): boolean {
        return intent === LLMIntent.GENERATE_REPORT;
    }


    async handle(data: any, context: ActionContext): Promise<void> {
        const reportType = data?.type || 'FLASH';

        // Feature Flag Check for Advanced Reports
        if (reportType === 'WEEKLY' && context.organizationId) {
             const { hasAccess } = await this.checkFeatureUseCase.execute({
                organizationId: context.organizationId,
                feature: FeatureFlag.ADVANCED_ANALYTICS
             });
             if (!hasAccess) {
                await context.messagingService.sendMessage(context.senderPhoneNumber, "🔒 Les rapports hebdomadaires nécessitent un abonnement Premium.");
                return;
             }
        }

        // Enqueue Job for Async Generation
        await this.reportsQueue.add('generate-report', {
            phoneNumber: context.senderPhoneNumber,
            organizationId: context.organizationId || null,
            type: data?.type || 'FLASH',
            start_date: data?.start_date,
            end_date: data?.end_date,
            platform: context.platform  // Pass platform for correct adapter selection
        });

        // Send confirmation message
        await context.messagingService.sendMessage(
            context.senderPhoneNumber,
            `📊 *Rapport en cours de génération...*\n\nVous recevrez le PDF dans quelques instants.`
        );

        // Emit Event (fetch user first)
        const user = await this.userRepository.findByPhoneNumber(context.senderPhoneNumber);
        if (user) {
             this.eventEmitter.emit('report.generated', {
                userId: user.id,
                organizationId: user.lastActiveOrganizationId || 'unknown',
                senderPhoneNumber: context.senderPhoneNumber,
                platform: context.platform
            });
        }
    }
}
