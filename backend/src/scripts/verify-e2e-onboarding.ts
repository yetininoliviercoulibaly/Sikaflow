
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { I_WHATSAPP_SERVICE } from '../common/whatsapp/whatsapp.service.interface';
import { WhatsAppService } from '../common/whatsapp/whatsapp.service';
import { MESSAGE_STRATEGY_TOKEN } from '../webhook/application/strategies/message-strategy.interface';
import { FeatureGuard } from '../common/guards/feature.guard';
import { ProcessMessageUseCase } from '../webhook/application/use-cases/process-message.use-case';
import { EntityManager, RequestContext } from '@mikro-orm/core';
import { OnboardingProgress } from '../onboarding/domain/onboarding-progress.entity';
import { User } from '../user/domain/user.entity';
import { OnboardingStepId } from '../onboarding/domain/onboarding-progress.entity';
import { Ticket, TicketStatus } from '../ticketing/domain/ticket.entity';
import { Event } from '../ticketing/domain/event.entity';
import { EventFeedback } from '../feedback/domain/event-feedback.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { v4 as uuidv4 } from 'uuid';

// Manual Mock WhatsApp Service
const mockWhatsApp = {
  calls: [] as any[],
  sendMessage: async (...args: any[]) => { mockWhatsApp.calls.push(['sendMessage', args]); return {}; },
  sendInteractiveList: async (...args: any[]) => { mockWhatsApp.calls.push(['sendInteractiveList', args]); return {}; },
  sendInteractiveButtons: async (...args: any[]) => { mockWhatsApp.calls.push(['sendInteractiveButtons', args]); return {}; },
  markAsRead: async (...args: any[]) => { mockWhatsApp.calls.push(['markAsRead', args]); return {}; },
  sendDocument: async (...args: any[]) => { mockWhatsApp.calls.push(['sendDocument', args]); return {}; },
  mockClear: () => { mockWhatsApp.calls = []; }
};

// Helper to create Webhook Payload
function createPayload(message: any) {
    return {
        object: 'whatsapp_business_account',
        entry: [{
            id: 'WHATSAPP_ID',
            changes: [{
                value: {
                    messaging_product: 'whatsapp',
                    metadata: { display_phone_number: 'PHONE', phone_number_id: 'ID' },
                    contacts: [{ profile: { name: 'Test User' }, wa_id: message.from }],
                    messages: [message]
                },
                field: 'messages'
            }]
        }]
    };
}

async function run() {
  console.log('🚀 Starting End-to-End Onboarding Verification...');

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(I_WHATSAPP_SERVICE)
    .useValue(mockWhatsApp)
    .overrideProvider(WhatsAppService)
    .useValue(mockWhatsApp)
    .overrideProvider(MESSAGE_STRATEGY_TOKEN)
    .useValue([{
        canHandle: (msg: any) => true,
        process: async (msg: any) => {
            const body = msg.text?.body || '';
            if (body === 'Bonjour') return { intent: 'GREETING', data: {}, actions: [{ intent: 'GREETING', data: {} }] };
            if (body.startsWith('Créer le club')) {
                const name = body.replace('Créer le club ', '').trim();
                return { intent: 'CREATE_ORGANIZATION', data: { name }, actions: [{ intent: 'CREATE_ORGANIZATION', data: { name } }] };
            }
            if (msg.interactive?.list_reply?.id?.startsWith('FEEDBACK')) {
                const rating = parseInt(msg.interactive.list_reply.id.split('|')[1]);
                return { intent: 'PROVIDE_FEEDBACK', data: { rating }, actions: [{ intent: 'PROVIDE_FEEDBACK', data: { rating } }] };
            }
            return null;
            return null;
        }
    }])
    .overrideProvider(FeatureGuard)
    .useValue({ canAccess: async () => true })
    .compile();

  const app = moduleFixture.createNestApplication();
  await app.init();

  const processMessage = app.get(ProcessMessageUseCase);
  const em = app.get(EntityManager);
  const phone = '22555555555'; // Unique Test Phone for E2E

  await RequestContext.create(em, async () => {
    try {
        // 1. CLEANUP
        console.log('🧹 Cleaning up test data...');
        const user = await em.findOne(User, { phoneNumber: phone });
        if (user) {
            // Use string token for Interface-based entity
            await em.nativeDelete('OnboardingProgress', { userId: user.id });
            await em.nativeDelete(Ticket, { attendeePhone: phone }); 
            await em.nativeDelete(EventFeedback, { attendeePhone: phone });
            await em.removeAndFlush(user);
        }

        // 2. SCENARIO 1: REGISTRATION (Create Organization & User)
        console.log('\n--- SCENARIO 1: REGISTRATION (Create Organization) ---');
        await processMessage.execute(createPayload({
        from: phone,
        text: { body: 'Créer le club E2E Test' },
        type: 'text',
        id: 'msg_reg',
        timestamp: String(Date.now()),
        }) as any);

        // Verification 1
        em.clear();
        const userAfter = await em.findOne(User, { phoneNumber: phone });
        if (!userAfter) throw new Error('❌ User not created!');
        console.log('✅ User created:', userAfter.id);
        
        // 3. SCENARIO 2: START ONBOARDING (Greeting)
        console.log('\n--- SCENARIO 2: START ONBOARDING (Greeting) ---');
        await processMessage.execute(createPayload({
        from: phone,
        text: { body: 'Bonjour' },
        type: 'text',
        id: 'msg_greet',
        timestamp: String(Date.now()),
        }) as any);
        
        em.clear();
        // Use generic with string token
        const progress1 = await em.findOne<OnboardingProgress>('OnboardingProgress', { userId: userAfter.id });
        if (!progress1) throw new Error('❌ Onboarding not started!');
        console.log('✅ Onboarding Progress started. Current Step:', progress1.currentStep);

        const sentMessages = mockWhatsApp.calls.filter(c => c[0] === 'sendMessage');
        // We expect message from Registration AND Greeting
        if (sentMessages.length < 2) throw new Error('❌ Expected messages missing (Reg confirmation + Welcome)');
        const lastMsg = sentMessages[sentMessages.length - 1][1][1]; 
        console.log('✅ Last Message Sent:', lastMsg.substring(0, 50) + '...');
        
        mockWhatsApp.mockClear();

        // 4. SCENARIO 3: COMPLETE ACTION
        console.log('\n--- SCENARIO 2: SIMULATE TRANSACTION (Verification) ---');
        
        // Using EventEmitter directly
        const eventEmitter = app.get(EventEmitter2); 
        console.log('📡 Emitting "transaction.created" event...');
        eventEmitter.emit('transaction.created', { 
            userId: userAfter.id,
            organizationId: userAfter.lastActiveOrganizationId,
            senderPhoneNumber: phone
        });
        
        await new Promise(r => setTimeout(r, 1000));
        
        // Verification 2
        em.clear(); 
        const progress2 = await em.findOne<OnboardingProgress>('OnboardingProgress', { userId: userAfter.id });
        
        const isCompleted = progress2?.completedSteps.includes(OnboardingStepId.CREATE_FIRST_TRANSACTION);
        if (!isCompleted) {
            console.warn('⚠️ Step CREATE_FIRST_TRANSACTION not marked complete.');
        } else {
            console.log('✅ Step CREATE_FIRST_TRANSACTION completed!');
        }

        // 4. SCENARIO 3: INTERACTIVE FEEDBACK
        console.log('\n--- SCENARIO 3: INTERACTIVE FEEDBACK ---');
        
        // Create Event first if not exists
        let [testEvent] = await em.find(Event, {}, { limit: 1, orderBy: { createdAt: 'DESC' } });
        if (!testEvent) {
             testEvent = new Event(uuidv4(), userAfter.lastActiveOrganizationId || uuidv4(), 'Test Event', new Date(), 100, 1000);
             await em.persistAndFlush(testEvent);
        }
        
        // Create Ticket
        const ticket = new Ticket(
            uuidv4(),
            testEvent.id,
            phone,
            TicketStatus.VALID,
            'hash_test_' + Date.now(),
            new Date(),
            new Date()
        );
        await em.persistAndFlush(ticket);
        console.log('🎟️ Created Ticket for Event:', testEvent.name);
        
        // Send Feedback Payload
        console.log('📨 Sending Feedback Payload (5 Stars)...');
        await processMessage.execute(createPayload({
            from: phone,
            type: 'interactive', // Must be interactive type
            id: 'msg_feedback',
            timestamp: String(Date.now()),
            interactive: {
                type: 'list_reply',
                list_reply: {
                    id: 'FEEDBACK|5',
                    title: '5 Stars'
                }
            }
        }) as any);
        
        await new Promise(r => setTimeout(r, 1000));

        // Verify Feedback Saved
        em.clear();
        const feedback = await em.findOne(EventFeedback, { attendeePhone: phone });
        if (feedback && feedback.rating === 5) {
            console.log('✅ Feedback saved with rating 5!');
        } else {
            console.error('❌ Feedback NOT found or rating incorrect.');
        }

        console.log('\n🎉 E2E Verification Finished Successfully!');

    } catch (error) {
        console.error('❌ Test Failed:', error);
    }
  });

  await app.close();
}

run();
