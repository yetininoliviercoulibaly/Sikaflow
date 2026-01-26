import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AgentOrchestratorService } from './agent-orchestrator.service';
import { TransactionModule } from '../transaction/transaction.module';
import { LlmModule } from '../common/llm/llm.module';
import { TicketingModule } from '../ticketing/ticketing.module';
import { OrganizationModule } from '../organization/organization.module';
import { ContactModule } from '../contact/contact.module';
import { IncidentModule } from '../incident/incident.module';
import { PaymentModule } from '../payment/payment.module';
import { MessagingModule } from '../common/messaging/messaging.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { AuthModule } from '../auth/auth.module';
import { BullModule } from '@nestjs/bullmq';
import { LangchainAgentAdapter } from './infrastructure/langchain-agent.adapter';
import { I_AGENT_SERVICE } from './domain/ports/agent-service.interface';

// Tools
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

@Module({
  imports: [
      ConfigModule, 
      TransactionModule, 
      LlmModule, 
      TicketingModule,
      OrganizationModule,
      ContactModule,
      IncidentModule,
      PaymentModule,
      MessagingModule,
      SubscriptionModule,
      AuthModule,
      BullModule.registerQueue({
          name: 'reports',
      }),
  ],
  providers: [
      AgentOrchestratorService, 
      {
          provide: I_AGENT_SERVICE,
          useClass: LangchainAgentAdapter,
      },
      CreateTransactionTool,
      CreateEventTool,
      CheckStockTool,
      ListEventsTool,
      AddMemberTool,
      SwitchOrganizationTool,
      CreateOrganizationTool,
      ScanTicketTool,
      ClaimTicketTool,
      GenerateClaimTool,
      AddDebtTool,
      SettleDebtTool,
      ListDebtsTool,
      SendReminderTool,
      GenerateReportTool,
      ReportIncidentTool,
      CreateCategoryTool,
      ListCategoriesTool,
      UpdateCategoryTool,
      DeleteCategoryTool,
      SubscribeTool,
      RequestAccessTool,
  ],
  exports: [AgentOrchestratorService],
})
export class AgentModule {}
