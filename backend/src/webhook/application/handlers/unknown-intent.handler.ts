import { Injectable, Inject } from '@nestjs/common';
import { IActionHandler, ActionContext } from './action-handler.interface';
import { LLMIntent } from '../../../common/llm/llm-types';
import { AgentOrchestratorService } from '../../../agent/agent-orchestrator.service';

@Injectable()
export class UnknownIntentHandler implements IActionHandler {
    constructor(
        private readonly agentOrchestrator: AgentOrchestratorService,
    ) {}

    canHandle(intent: string): boolean {
        return intent === LLMIntent.UNKNOWN;
    }

    async handle(_data: Record<string, unknown>, context: ActionContext): Promise<void> {
        const { senderPhoneNumber, organizationId, messagingService, messageBody } = context;

        // Instead of a static error, we pass the "Unknown" message to the Agent.
        // The Agent might understand it (e.g., conversational filler) or ask for clarification naturally.

        const input = messageBody || "Bonjour"; // Fallback if empty

        const response = await this.agentOrchestrator.run(
            input,
            senderPhoneNumber,
            {
                phoneNumber: senderPhoneNumber,
                organizationId: organizationId || undefined
            }
        );

        await messagingService.sendMessage(
            senderPhoneNumber,
            response
        );
    }
}
