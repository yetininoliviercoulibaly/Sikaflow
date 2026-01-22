import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateTransactionTool } from './tools/create-transaction.tool';
import { CreateEventTool } from './tools/create-event.tool';
import { CheckStockTool } from './tools/check-stock.tool';
import { ListEventsTool } from './tools/list-events.tool';
import { AddMemberTool } from './tools/add-member.tool';
import { SwitchOrganizationTool } from './tools/switch-organization.tool';
import { CreateOrganizationTool } from './tools/create-organization.tool';
import { ScanTicketTool } from './tools/scan-ticket.tool';
import { ClaimTicketTool } from './tools/claim-ticket.tool';
import { GenerateClaimTool } from './tools/generate-claim.tool';
import { AddDebtTool } from './tools/add-debt.tool';
import { SettleDebtTool } from './tools/settle-debt.tool';
import { ListDebtsTool } from './tools/list-debts.tool';
import { SendReminderTool } from './tools/send-reminder.tool';
import { GenerateReportTool } from './tools/generate-report.tool';
import { ReportIncidentTool } from './tools/report-incident.tool';
import { CreateCategoryTool } from './tools/create-category.tool';
import { ListCategoriesTool } from './tools/list-categories.tool';
import { UpdateCategoryTool } from './tools/update-category.tool';
import { DeleteCategoryTool } from './tools/delete-category.tool';
import { SubscribeTool } from './tools/subscribe.tool';
import { RequestAccessTool } from './tools/request-access.tool';
import { ILLMProvider, LLM_PROVIDER_TOKEN } from '../common/llm/llm-provider.interface';

@Injectable()
export class AgentOrchestratorService implements OnModuleInit {
  private readonly logger = new Logger(AgentOrchestratorService.name);
  private agent: any; 

  constructor(
      private readonly configService: ConfigService,
      @Inject(LLM_PROVIDER_TOKEN) private readonly llmProvider: ILLMProvider,
      private readonly createTransactionTool: CreateTransactionTool,
      private readonly createEventTool: CreateEventTool,
      private readonly checkStockTool: CheckStockTool,
      private readonly listEventsTool: ListEventsTool,
      private readonly addMemberTool: AddMemberTool,
      private readonly switchOrganizationTool: SwitchOrganizationTool,
      private readonly createOrganizationTool: CreateOrganizationTool,
      private readonly scanTicketTool: ScanTicketTool,
      private readonly claimTicketTool: ClaimTicketTool,
      private readonly generateClaimTool: GenerateClaimTool,
      private readonly addDebtTool: AddDebtTool,
      private readonly settleDebtTool: SettleDebtTool,
      private readonly listDebtsTool: ListDebtsTool,
      private readonly sendReminderTool: SendReminderTool,
      private readonly generateReportTool: GenerateReportTool,
      private readonly reportIncidentTool: ReportIncidentTool,
      private readonly createCategoryTool: CreateCategoryTool,
      private readonly listCategoriesTool: ListCategoriesTool,
      private readonly updateCategoryTool: UpdateCategoryTool,
      private readonly deleteCategoryTool: DeleteCategoryTool,
      private readonly subscribeTool: SubscribeTool,
      private readonly requestAccessTool: RequestAccessTool,
  ) {}

  onModuleInit() {
    // @ts-ignore
    const { createReactAgent } = require('@langchain/langgraph/prebuilt');
    // @ts-ignore
    const { MemorySaver } = require('@langchain/langgraph');
    
    const model = this.llmProvider.getModel();

    const tools = [
        this.createTransactionTool,
        this.createEventTool,
        this.checkStockTool,
        this.listEventsTool,
        this.addMemberTool,
        this.switchOrganizationTool,
        this.createOrganizationTool,
        this.scanTicketTool,
        this.claimTicketTool,
        this.generateClaimTool,
        this.addDebtTool,
        this.settleDebtTool,
        this.listDebtsTool,
        this.sendReminderTool,
        this.generateReportTool,
        this.reportIncidentTool,
        this.createCategoryTool,
        this.listCategoriesTool,
        this.updateCategoryTool,
        this.deleteCategoryTool,
        this.subscribeTool,
        this.requestAccessTool,
    ];
    
    // Create the ReAct Agent Graph
    const checkpointer = new MemorySaver();
    
    this.agent = createReactAgent({
        llm: model,
        tools: tools,
        checkpointSaver: checkpointer,
        messageModifier: `You are SikaFlow Assistant, a professional AI for event organizers. 
        Your goal is to help them manage ticketing, transactions (expenses/income), team members, and check event stocks.
        
        CRITICAL RULES:
        1. Always be polite and professional.
        2. If a tool requires a 'phoneNumber' or 'userId', use the one provided in the context: {{phoneNumber}}.
        3. If you are missing information to call a tool, ask the user clearly.
        4. Focus on being concise and helpful.
        5. You can handle multiple steps (e.g., check stock then create a transaction).
        6. For debt management, use the proper tool (add_debt, settle_debt, etc.).
        7. If user asks for a report, use generate_report.`
    });

    this.logger.log('AgentOrchestratorService initialized with LangGraph ReAct Agent');
  }

  async run(input: string, threadId: string, context: { phoneNumber: string; organizationId?: string }): Promise<string> {
    this.logger.log(`Running Agent for thread ${threadId} (User: ${context.phoneNumber}): ${input}`);
    
    const enrichedInput = `User Context: [Phone: ${context.phoneNumber}, Org: ${context.organizationId || 'None'}].\nUser Message: ${input}`;
    
    const config = { configurable: { thread_id: threadId } };
    
    const { HumanMessage } = require('@langchain/core/messages');
    
    const stream = await this.agent.stream(
        { messages: [new HumanMessage(enrichedInput)] },
        config
    );

    let finalResponse = "";

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
    const lastMessage = state.values.messages[state.values.messages.length - 1];
    
    if (lastMessage && lastMessage.content) {
        return lastMessage.content as string;
    }
    
    return finalResponse || "Je n'ai pas pu traiter votre demande.";
  }
}



