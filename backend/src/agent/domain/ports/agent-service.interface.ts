export interface AgentRunContext {
  phoneNumber: string;
  organizationId?: string;
}

export const I_AGENT_SERVICE = 'IAgentService';

export interface IAgentService {
  run(input: string, threadId: string, context: AgentRunContext): Promise<string>;
}
