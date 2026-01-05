
import { HelpHandler } from '../webhook/application/handlers/help.handler';
import { CreateOrganizationHandler } from '../webhook/application/handlers/create-organization.handler';
import { UserRole } from '../organization/domain/organization-member.entity';

// Mocks
const mockConfigService = {
    get: (key: string) => {
        if (key === 'DEFAULT_COUNTRY_CODE') return '+33'; // Test with +33 instead of +225
        return null;
    }
};

const mockWhatsAppService = {
    messages: [] as string[],
    sendMessage: async (to: string, text: string) => {
        mockWhatsAppService.messages.push(text);
        console.log(`[WhatsApp] To ${to}: ${text.split('\n')[0]}...`);
    }
};

const mockUserRepository = {
    findByPhoneNumber: async () => ({ id: 'u1', lastActiveOrganizationId: 'org1' })
};

const mockOrganizationRepository = {
    findMember: async () => ({ role: UserRole.MANAGER })
};

const mockCreateOrgUseCase = {
    execute: async () => {} 
};

async function verifyConfig() {
    console.log('--- STARTING CONFIG VERIFICATION (+33) ---');
    
    // Test HelpHandler
    const helpHandler = new HelpHandler(
        mockWhatsAppService as any,
        mockUserRepository as any,
        mockOrganizationRepository as any,
        mockConfigService as any
    );
    
    console.log('\nTesting HelpHandler...');
    await helpHandler.handle({}, { senderPhoneNumber: '+123', organizationId: 'org1' } as any);
    
    const helpMsg = mockWhatsAppService.messages[mockWhatsAppService.messages.length - 1];
    if (helpMsg.includes('+33')) {
        console.log('✅ HelpHandler used configured code +33');
    } else {
        console.error('❌ HelpHandler DID NOT use +33');
        console.log(helpMsg);
    }

    // Test CreateOrganizationHandler
    const createHandler = new CreateOrganizationHandler(
        mockCreateOrgUseCase as any,
        mockWhatsAppService as any,
        mockConfigService as any
    );

    console.log('\nTesting CreateOrganizationHandler...');
    await createHandler.handle({ name: 'Club Paris' }, { senderPhoneNumber: '+123' } as any);
    
    const createMsg = mockWhatsAppService.messages[mockWhatsAppService.messages.length - 1];
    if (createMsg.includes('+33')) {
        console.log('✅ CreateOrganizationHandler used configured code +33');
    } else {
        console.error('❌ CreateOrganizationHandler DID NOT use +33');
        console.log(createMsg);
    }
}

verifyConfig();
