import { Test, TestingModule } from '@nestjs/testing';
import { GenerateDailyReportUseCase } from '../report/application/use-cases/generate-daily-report.use-case';
import { ReportScheduler } from '../report/infrastructure/cron/report.scheduler';
import { WhatsAppService } from '../common/whatsapp/whatsapp.service';
import { BusinessIntelligenceService } from '../report/application/services/business-intelligence.service';
import { I_SUBSCRIPTION_REPOSITORY } from '../subscription/domain/ports/subscription.repository.interface';
import { I_EVENT_PASS_REPOSITORY } from '../subscription/domain/ports/event-pass.repository.interface';
import { I_ORGANIZATION_REPOSITORY } from '../organization/domain/ports/organization.repository.interface';
import { I_USER_REPOSITORY } from '../user/domain/ports/user.repository.interface';

// Simple Mock Implementation
const createMockFn = (returnValue?: any) => {
    const fn: any = (...args: any[]) => {
        fn.calls.push(args);
        return Promise.resolve(fn.returnValue !== undefined ? fn.returnValue : returnValue);
    };
    fn.calls = [] as any[][];
    fn.returnValue = returnValue;
    fn.mockResolvedValue = (val: any) => {
        fn.returnValue = val;
        return fn; 
    }
    return fn;
};

// Mocks
const mockWhatsAppService = { sendMessage: createMockFn(true) };
const mockBiService = { getRawMetric: createMockFn(1000) };

const mockSubRepo = { findAllActive: createMockFn([]) };
const mockPassRepo = { findAllActive: createMockFn([]) };
const mockOrgRepo = { findOwner: createMockFn({ userId: 'u1' }) };
const mockUserRepo = { findById: createMockFn({ phoneNumber: '123' }) };

async function verifyUS13() {
    console.log('--- Verifying US.13 (Daily Reports) ---');
    
    // Setup Module
    const moduleRef: TestingModule = await Test.createTestingModule({
        providers: [
            GenerateDailyReportUseCase,
            ReportScheduler,
            { provide: WhatsAppService, useValue: mockWhatsAppService },
            { provide: BusinessIntelligenceService, useValue: mockBiService },
            { provide: I_SUBSCRIPTION_REPOSITORY, useValue: mockSubRepo },
            { provide: I_EVENT_PASS_REPOSITORY, useValue: mockPassRepo }, // Not used for daily but keeping for DI
            { provide: I_ORGANIZATION_REPOSITORY, useValue: mockOrgRepo },
            { provide: I_USER_REPOSITORY, useValue: mockUserRepo },
        ],
    }).compile();

    const scheduler = moduleRef.get<ReportScheduler>(ReportScheduler);

    // Scenario 1: No Active Subs
    console.log('1. Testing with No Active Users...');
    await scheduler.handleDailyReports();
    // Expect no calls to whatsapp
    if (mockWhatsAppService.sendMessage.calls.length === 0) {
        console.log('✅ Correctly handled no active organizations.');
    } else {
        console.error('❌ Sent message when no orgs active.');
    }

    // Scenario 2: Active Org with Data
    console.log('2. Testing with Active Org & Data...');
    const orgId = 'org-1';
    
    // Reset calls
    mockWhatsAppService.sendMessage.calls = [];
    
    // Setup data
    mockSubRepo.findAllActive.mockResolvedValue([{ organizationId: orgId }]);
    
    mockBiService.getRawMetric = createMockFn(0); 
    mockBiService.getRawMetric.returnValue = 5000; 

    await scheduler.handleDailyReports();

    if (mockWhatsAppService.sendMessage.calls.length > 0) {
        const msg = mockWhatsAppService.sendMessage.calls[0][1];
        console.log('✅ Message Sent:', msg);
        if (msg.includes('Flash Quotidien') && msg.includes('Chiffre')) {
             console.log('✅ Content Verified.');
        } else {
             console.error('❌ Content invalid.');
        }
    } else {
        console.error('❌ No message sent for active org.');
    }

    console.log('--- US.13 Verification Complete ---');
}

verifyUS13();
