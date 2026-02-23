import { Injectable, Logger, Inject } from '@nestjs/common';
import { IAgentService, AgentRunContext } from '../domain/ports/agent-service.interface';
import { ILLMProvider, LLM_PROVIDER_TOKEN } from '../../common/llm/llm-provider.interface';

@Injectable()
export class LangchainAgentAdapter implements IAgentService {
  private readonly logger = new Logger(LangchainAgentAdapter.name);
  private agent: any;

  constructor(
    @Inject(LLM_PROVIDER_TOKEN) private readonly llmProvider: ILLMProvider,
  ) {}

  async init(messageModifier: string, tools: any[]) {
    // Dynamic imports to avoid ESM/Jest issues in some environments
    // @ts-ignore
    const { createReactAgent } = require('@langchain/langgraph/prebuilt');
    // @ts-ignore
    const { MemorySaver } = require('@langchain/langgraph');

    const checkpointer = new MemorySaver();
    const model = this.llmProvider.getModel();

    this.agent = createReactAgent({
      llm: model,
      tools: tools,
      checkpointSaver: checkpointer,
      messageModifier
    });
    
    this.logger.log('LangchainAgentAdapter initialized');
  }

  async run(input: string, threadId: string, context: AgentRunContext): Promise<string> {
    if (!this.agent) {
      this.logger.error('Agent not initialized. Call init() before run().');
      return "Je n'ai pas pu traiter votre demande (agent non initialisé).";
    }

    const enrichedInput = `User Context: [Phone: ${context.phoneNumber}, Org: ${context.organizationId || 'None'}].\nUser Message: ${input}`;
    const config = { configurable: { thread_id: threadId } };

    // @ts-ignore
    const { HumanMessage } = require('@langchain/core/messages');

    let finalResponse = "";

    try {
      const stream = await this.agent.stream(
        { messages: [new HumanMessage(enrichedInput)] },
        config
      );

      for await (const chunk of stream) {
        if (chunk.agent) {
          if (chunk.agent.messages && chunk.agent.messages.length > 0) {
            const lastMsg = chunk.agent.messages[chunk.agent.messages.length - 1];
            if (lastMsg.content) {
              finalResponse = lastMsg.content;
            }
          }
        }
      }

      const state = await this.agent.getState(config);
      const messages = state?.values?.messages;
      if (messages && messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && lastMessage.content) {
          return lastMessage.content as string;
        }
      }
    } catch (error) {
      this.logger.error(`Agent run failed for thread ${threadId}`, error);
      return finalResponse || "Une erreur s'est produite lors du traitement de votre demande.";
    }

    return finalResponse || "Je n'ai pas pu traiter votre demande.";
  }
}
