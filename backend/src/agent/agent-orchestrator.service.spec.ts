import { Test, TestingModule } from '@nestjs/testing';
import { AgentOrchestratorService } from './agent-orchestrator.service';
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
import { LLM_PROVIDER_TOKEN } from '../common/llm/llm-provider.interface';
import { I_AGENT_SERVICE } from './domain/ports/agent-service.interface';

// Mock ConfigService
const mockConfigService = {
  get: jest.fn((key: string) => {
    if (key === 'GEMINI_API_KEY') return 'test-api-key';
    return null;
  }),
};

// Mock LLM Provider
const mockLLMProvider = {
    getModel: jest.fn().mockReturnValue({
        invoke: jest.fn(),
        bind: jest.fn(),
        pipe: jest.fn(),
    } as any)
};

// Tool Mock Helper
const createMockTool = (name: string) => ({
    name,
    description: 'mock',
    schema: { parse: (i: any) => i },
    invoke: jest.fn()
});

describe('AgentOrchestratorService', () => {
  let service: AgentOrchestratorService;
  let agentService: TestAgentService; // Define interface for mock

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentOrchestratorService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: LLM_PROVIDER_TOKEN, useValue: mockLLMProvider },
        { 
            provide: I_AGENT_SERVICE, 
            useValue: { 
                init: jest.fn(), 
                run: jest.fn() 
            } 
        },
        { provide: CreateTransactionTool, useValue: createMockTool('create_transaction') },
        { provide: CreateEventTool, useValue: createMockTool('create_event') },
        { provide: CheckStockTool, useValue: createMockTool('check_stock') },
        { provide: ListEventsTool, useValue: createMockTool('list_events') },
        { provide: AddMemberTool, useValue: createMockTool('add_member') },
        { provide: SwitchOrganizationTool, useValue: createMockTool('switch_organization') },
        { provide: CreateOrganizationTool, useValue: createMockTool('create_organization') },
        { provide: ScanTicketTool, useValue: createMockTool('scan_ticket') },
        { provide: ClaimTicketTool, useValue: createMockTool('claim_ticket') },
        { provide: GenerateClaimTool, useValue: createMockTool('generate_claim') },
        { provide: AddDebtTool, useValue: createMockTool('add_debt') },
        { provide: SettleDebtTool, useValue: createMockTool('settle_debt') },
        { provide: ListDebtsTool, useValue: createMockTool('list_debts') },
        { provide: SendReminderTool, useValue: createMockTool('send_reminder') },
        { provide: GenerateReportTool, useValue: createMockTool('generate_report') },
        { provide: ReportIncidentTool, useValue: createMockTool('report_incident') },
        { provide: CreateCategoryTool, useValue: createMockTool('create_category') },
        { provide: ListCategoriesTool, useValue: createMockTool('list_categories') },
        { provide: UpdateCategoryTool, useValue: createMockTool('update_category') },
        { provide: DeleteCategoryTool, useValue: createMockTool('delete_category') },
        { provide: SubscribeTool, useValue: createMockTool('subscribe') },
        { provide: RequestAccessTool, useValue: createMockTool('request_access') },
      ],
    }).compile();

    service = module.get<AgentOrchestratorService>(AgentOrchestratorService);
    agentService = module.get<TestAgentService>(I_AGENT_SERVICE);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize the agent', async () => {
    await service.onModuleInit();
    expect(agentService.init).toHaveBeenCalled();
  });
});

interface TestAgentService {
    init: jest.Mock;
    run: jest.Mock;
}


