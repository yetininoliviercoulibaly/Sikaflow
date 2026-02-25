export interface AgentRunContext {
  phoneNumber: string;
  organizationId?: string;
}

export const I_AGENT_SERVICE = 'IAgentService';

export interface IAgentService {
  init?(messageModifier: string, tools: any[]): Promise<void>;
  run(input: string, threadId: string, context: AgentRunContext): Promise<string>;
}
