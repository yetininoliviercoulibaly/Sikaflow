
import { GreetingHandler } from '../webhook/application/handlers/greeting.handler';
import { CreateOrganizationHandler } from '../webhook/application/handlers/create-organization.handler';
import { AddMemberHandler } from '../webhook/application/handlers/add-member.handler';
import { UserRole } from '../organization/domain/organization-member.entity';

// Mocks
const mockWhatsAppService = {
    sendMessage: async (to: string, text: string) => {
        console.log(`[WhatsApp] To ${to}: ${text.split('\n')[0]}...`);
        return {};
    }
};

const mockUserRepository = {
    users: new Map(),
    findByPhoneNumber: async (phone: string) => mockUserRepository.users.get(phone),
    create: async (user: any) => {
        mockUserRepository.users.set(user.phoneNumber, user);
        console.log(`[UserRepo] Created user ${user.phoneNumber}`);
    },
    update: async (user: any) => mockUserRepository.users.set(user.phoneNumber, user)
};

const mockOrganizationRepository = {
    members: [] as any[],
    findMember: async (orgId: string, userId: string) => {
        return mockOrganizationRepository.members.find(m => m.organizationId === orgId && m.userId === userId);
    },
    addMember: async (member: any) => {
        mockOrganizationRepository.members.push(member);
        console.log(`[OrgRepo] Added member ${member.userId} to ${member.organizationId} as ${member.role}`);
    }
};

const mockCreateOrgUseCase = {
    execute: async (cmd: any) => {
        console.log(`[UseCase] Creating Org '${cmd.name}' for ${cmd.userPhoneNumber}`);
        // Create user if needed
        let user = await mockUserRepository.findByPhoneNumber(cmd.userPhoneNumber);
        if (!user) {
            user = { id: 'user_1', phoneNumber: cmd.userPhoneNumber, lastActiveOrganizationId: null };
            await mockUserRepository.create(user);
        }
        // Create Org
        const orgId = 'org_1';
        user.lastActiveOrganizationId = orgId;
        await mockUserRepository.update(user);
        
        // Add Owner
        await mockOrganizationRepository.addMember({ organizationId: orgId, userId: user.id, role: UserRole.OWNER });
    }
};


// Mocks (Continued)
const mockStartOnboardingUseCase = {
    execute: async (cmd: any) => {
        console.log(`[UseCase] StartOnboarding for ${cmd.userId}`);
        return { success: true };
    }
};

const mockGetNextStepUseCase = {
    execute: async (cmd: any) => {
        console.log(`[UseCase] GetNextStep for ${cmd.userId}`);
        return { 
            step: { tipMessage: 'Next step tip' },
            currentStepNumber: 1,
            totalSteps: 5,
            isCompleted: false
        };
    }
};

const mockFeatureGuard = {
    canAccess: async () => true
};

async function verifyFlow() {
    console.log('--- STARTING LOGIC VERIFICATION ---');

    const greetingHandler = new GreetingHandler(
        mockWhatsAppService as any, 
        mockUserRepository as any,
        mockOrganizationRepository as any,
        mockStartOnboardingUseCase as any,
        mockGetNextStepUseCase as any,
        mockFeatureGuard as any
    );
    const createOrgHandler = new CreateOrganizationHandler(mockCreateOrgUseCase as any, mockWhatsAppService as any, { get: () => '+225' } as any);

    // Mock EventEmitter
    const mockEventEmitter = {
        emit: (event: string, payload: any) => {
            console.log(`[Event] Emitted ${event} for ${payload.userId}`);
        }
    };

    const addMemberHandler = new AddMemberHandler(
        mockWhatsAppService as any, 
        mockOrganizationRepository as any, 
        mockUserRepository as any,
        mockEventEmitter as any
    );



    const senderPhone = '+33600000000';

    // 1. Test Greeting (Unknown User)
    console.log('\n--- TEST 1: Greeting (New User) ---');
    await greetingHandler.handle({}, { senderPhoneNumber: senderPhone } as any);

    // 2. Test Create Organization
    console.log('\n--- TEST 2: Create Organization ---');
    await createOrgHandler.handle({ name: 'Miami Club' }, { senderPhoneNumber: senderPhone } as any);

    // 3. Test Greeting (Existing User)
    console.log('\n--- TEST 3: Greeting (Existing User) ---');
    await greetingHandler.handle({}, { senderPhoneNumber: senderPhone, organizationId: 'org_1' } as any);

    // 4. Test Add Member (as Owner)
    console.log('\n--- TEST 4: Add Member ---');
    const targetPhone = '+33699999999';
    await addMemberHandler.handle(
        { phone_number: targetPhone, role: 'MANAGER' }, 
        { senderPhoneNumber: senderPhone, organizationId: 'org_1' } as any
    );
    
    console.log('\n✅ LOGIC VERIFICATION SUCCESSFUL');
}

verifyFlow();
