import { Inject, Injectable, Logger } from '@nestjs/common';
import { IActionHandler, ActionContext } from './action-handler.interface';
import { LLMIntent } from '../../../common/llm/llm-types';
import { FeatureFlag } from '../../../subscription/domain/feature-flag.enum';
import { CheckFeatureUseCase } from '../../../subscription/application/use-cases/check-feature.use-case';
import { Incident, IncidentSeverity, IncidentStatus } from '../../../incident/domain/incident.entity';
import { IIncidentRepository, I_INCIDENT_REPOSITORY } from '../../../incident/domain/ports/incident.repository.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ReportIncidentHandler implements IActionHandler {
    private readonly logger = new Logger(ReportIncidentHandler.name);

    constructor(
        @Inject(I_INCIDENT_REPOSITORY) private readonly incidentRepository: IIncidentRepository,
        private readonly checkFeatureUseCase: CheckFeatureUseCase,
    ) {}

    canHandle(intent: string): boolean {
        return intent === LLMIntent.REPORT_INCIDENT;
    }

    async handle(data: any, context: ActionContext): Promise<void> {
        const { senderPhoneNumber, organizationId, messagingService, user } = context;

        if (!user) {
            await messagingService.sendMessage(senderPhoneNumber, "Utilisateur non identifié.");
            return;
        }

        // 1. Check Feature Access
        const { hasAccess } = await this.checkFeatureUseCase.execute({
            organizationId: organizationId!,
            feature: FeatureFlag.INCIDENT_COMPLIANCE,
        });

        if (!hasAccess) {
            await messagingService.sendMessage(senderPhoneNumber, "Cette fonctionnalité n'est pas incluse dans votre plan.");
            return;
        }

        // 2. Extract Data
        const description = data.description || "Aucune description fournie";
        const severityStr = (data.severity || 'MEDIUM').toUpperCase();
        const severity = Object.values(IncidentSeverity).includes(severityStr as IncidentSeverity) 
            ? severityStr as IncidentSeverity 
            : IncidentSeverity.MEDIUM;

        // 3. Create Incident
        const incident = new Incident(
            uuidv4(),
            organizationId!,
            user.id,
            null, // Origin Message ID (could be passed in context if needed)
            severity,
            description,
            IncidentStatus.OPEN,
            new Date(), // OccurredAt (default to now)
            new Date()  // CreatedAt
        );

        try {
            await this.incidentRepository.create(incident);
            
            // 4. Confirm to User
            const responseText = `🚨 *Incident Signalé*\n\nGravité: *${severity}*\nDescription: "${description}"\n\nL'équipe de sécurité a été notifiée.`;
            await messagingService.sendMessage(senderPhoneNumber, responseText);
            
            this.logger.log(`Incident reported by user ${user.id} in org ${organizationId}`);
        } catch (error) {
            this.logger.error(`Failed to report incident: ${error.message}`, error.stack);
            await messagingService.sendMessage(senderPhoneNumber, "Une erreur est survenue lors du signalement de l'incident. Veuillez réessayer.");
        }
    }
}
