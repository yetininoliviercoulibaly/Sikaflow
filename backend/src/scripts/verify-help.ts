
import { HelpHandler } from '../webhook/application/handlers/help.handler';
import { UserRole } from '../organization/domain/organization-member.entity';

// Mocks
const mockWhatsAppService = {
    sentMessages: [] as string[],
    sendMessage: async (to: string, text: string) => {
        const msg = `[WhatsApp] To ${to}: ${text.replace(/\n/g, ' ')}`;
        console.log(msg);
        mockWhatsAppService.sentMessages.push(text);
        return {};
    }
};

const mockUserRepository = {
    users: new Map(),
    findByPhoneNumber: async (phone: string) => mockUserRepository.users.get(phone),
    save: (user: any) => mockUserRepository.users.set(user.phoneNumber, user)
};

const mockOrganizationRepository = {
    members: [] as any[],
    findMember: async (orgId: string, userId: string) => {
        return mockOrganizationRepository.members.find(m => m.organizationId === orgId && m.userId === userId);
    }
};

const mockConfigService = {
    get: (key: string) => {
        if (key === 'ONBOARDING_PDF_URL') return 'http://example.com/guide.pdf';
        return null;
    }
};

async function verifyHelp() {
    console.log('--- STARTING HELP VERIFICATION ---');

    const helpHandler = new HelpHandler(
        mockWhatsAppService as any, 
        mockUserRepository as any, 
        mockOrganizationRepository as any,
        mockConfigService as any
    );

    // 1. Unknown User
    console.log('\n--- TEST 1: Help (Unknown User) ---');
    await helpHandler.handle({}, { senderPhoneNumber: '+33000' } as any);
    
    // 2. Active Staff
    console.log('\n--- TEST 2: Help (Staff) ---');
    const staffUser = { id: 'u_staff', phoneNumber: '+33111', lastActiveOrganizationId: 'org_1' };
    mockUserRepository.save(staffUser);
    mockOrganizationRepository.members.push({ organizationId: 'org_1', userId: 'u_staff', role: UserRole.STAFF });
    
    await helpHandler.handle({}, { senderPhoneNumber: '+33111', organizationId: 'org_1' } as any);

    // 3. Active Owner
    console.log('\n--- TEST 3: Help (Owner) ---');
    const ownerUser = { id: 'u_owner', phoneNumber: '+33222', lastActiveOrganizationId: 'org_1' };
    mockUserRepository.save(ownerUser);
    mockOrganizationRepository.members.push({ organizationId: 'org_1', userId: 'u_owner', role: UserRole.OWNER });

    await helpHandler.handle({}, { senderPhoneNumber: '+33222', organizationId: 'org_1' } as any);

    console.log('\n✅ HELP VERIFICATION SUCCESSFUL');
}

verifyHelp();
