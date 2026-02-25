import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
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
import { IAgentService, I_AGENT_SERVICE } from './domain/ports/agent-service.interface';

@Injectable()
export class AgentOrchestratorService implements OnModuleInit {
  private readonly logger = new Logger(AgentOrchestratorService.name);

  constructor(
      @Inject(I_AGENT_SERVICE) private readonly agentService: IAgentService,
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

  async onModuleInit() {
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

    const messageModifier = `You are SikaFlow Assistant, a professional AI for event organizers. 
        Your goal is to help them manage ticketing, transactions (expenses/income), team members, and check event stocks.

        GENERAL KNOWLEDGE (Use this to answer questions about the tool):
        - SikaFlow is a management tool for event organizers.
        - Users can send VOICE NOTES to perform any action (e.g., "Spent 5000 on water").
        - Key Features:
          - Transactions: Record expenses and income.
          - Ticketing: Scan tickets (QR codes), check stock, create events.
          - Reports: Generate financial reports.
          - Team: Add members to the organization.
        
        CRITICAL RULES:
        1. Always be polite and professional.
        2. If a tool requires a 'phoneNumber' or 'userId', use the one provided in the context: {{phoneNumber}}.
        3. If you are missing information to call a tool, ask the user clearly.
        4. Focus on being concise and helpful.
        5. You can handle multiple steps (e.g., check stock then create a transaction).
        6. For debt management, use the proper tool (add_debt, settle_debt, etc.).
        7. If user asks for a report, use generate_report.`;

    if (this.agentService.init) {
      await this.agentService.init(messageModifier, tools);
    }

    this.logger.log('AgentOrchestratorService initialized with IAgentService');
  }

  async run(input: string, threadId: string, context: { phoneNumber: string; organizationId?: string }): Promise<string> {
    this.logger.log(`Running Agent for thread ${threadId} (User: ${context.phoneNumber}): ${input}`);
    return this.agentService.run(input, threadId, context);
  }
}
