
import { SubscribeHandler } from '../webhook/application/handlers/subscribe.handler';
import { SubscriptionPlan } from '../subscription/domain/subscription-plan.entity';

// Mocks
const mockUseCase = {
    getPlansData: async (provider: string) => {
        if (provider === 'WAVE') return [
            { id: 'p1', name: 'Pass Trimestriel', price: 15000, currency: 'XOF', durationMonths: 3, paymentMethod: { code: 'WAVE' } } as SubscriptionPlan,
            { id: 'p2', name: 'Pass Annuel', price: 50000, currency: 'XOF', durationMonths: 12, paymentMethod: { code: 'WAVE' } } as SubscriptionPlan
        ];
        return [];
    },
    execute: async (planId: string) => ({ paymentLink: 'https://wave.com/pay/123' }),
    getPaymentMethods: async () => [
        { code: 'WAVE', name: 'Wave Mobile Money' },
        { code: 'STRIPE', name: 'Carte Bancaire' }
    ]
};

const mockWhatsAppService = {
    messages: [] as string[],
    sendMessage: async (to: string, text: string) => {
        mockWhatsAppService.messages.push(text);
        console.log(`[WhatsApp] To ${to}: ${text.split('\n')[0]}...`);
    }
};

async function verifySubscriptionFlow() {
    const handler = new SubscribeHandler(mockUseCase as any, mockWhatsAppService as any);
    const context = { senderPhoneNumber: '+22501010101', organizationId: 'org1' };

    console.log('--- TEST 1: Smart Direct Execution (Wave 3 months) ---');
    await handler.handle({ provider: 'WAVE', duration: 3 }, context as any);
    // Expect Success Link
    let lastMsg = mockWhatsAppService.messages[mockWhatsAppService.messages.length - 1];
    if (lastMsg.includes('https://wave.com/pay/123')) console.log('✅ Direct Execution Success');
    else console.error('❌ Direct Execution Failed', lastMsg);

    console.log('\n--- TEST 2: Invalid Duration (Wave 6 months) ---');
    await handler.handle({ provider: 'WAVE', duration: 6 }, context as any);
    // Expect List of Plans
    lastMsg = mockWhatsAppService.messages[mockWhatsAppService.messages.length - 1];
    if (lastMsg.includes('Pass Trimestriel')) console.log('✅ Fallback to Plan List Success');
    else console.error('❌ Fallback Failed', lastMsg);

    console.log('\n--- TEST 3: Conversational (No args) ---');
    await handler.handle({}, context as any);
    // Expect List of Methods
    lastMsg = mockWhatsAppService.messages[mockWhatsAppService.messages.length - 1];
    if (lastMsg.includes('WAVE') && lastMsg.includes('Carte Bancaire')) console.log('✅ Method List Success');
    else console.error('❌ Method List Failed', lastMsg);
}

verifySubscriptionFlow();
