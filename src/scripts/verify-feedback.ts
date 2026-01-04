
import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager, RequestContext } from '@mikro-orm/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ConfigModule } from '@nestjs/config';
import { Event } from '../ticketing/domain/event.entity';
import { Ticket, TicketStatus } from '../ticketing/domain/ticket.entity';
import { SendFeedbackRequestsUseCase } from '../feedback/application/use-cases/send-feedback-requests.use-case';
import { EventFeedback } from '../feedback/domain/event-feedback.entity';
import { TicketClaim } from '../ticketing/domain/ticket-claim.entity';
import { v4 as uuidv4 } from 'uuid';
import config from '../mikro-orm.config';
import { TicketingModule } from '../ticketing/ticketing.module';
import { FeedbackModule } from '../feedback/feedback.module';
import { I_WHATSAPP_SERVICE } from '../common/whatsapp/whatsapp.service.interface';
import { FeedbackHandler } from '../feedback/application/handlers/feedback.handler';

// Mock WhatsApp Service
const mockWhatsAppService = {
  callCount: 0,
  sendMessage: async (phone: string, msg: string) => {
      console.log(`[MockWhatsApp] To: ${phone}, Msg: ${msg}`);
      mockWhatsAppService.callCount++;
      return true;
  },
};

async function bootstrap() {
  const moduleRef: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true }),
      MikroOrmModule.forRoot(config),
      TicketingModule,
      FeedbackModule,
    ],
  })
  .overrideProvider(I_WHATSAPP_SERVICE)
  .useValue(mockWhatsAppService)
  .compile();

  const app = moduleRef.createNestApplication();
  await app.init();

  const em = app.get(EntityManager);
  const useCase = app.get(SendFeedbackRequestsUseCase);
  
  // 0. Cleanup
  const fork = em.fork();
  
  // 1. Create Past Event (Yesterday - 25h ago)
  const now = new Date();
  const pastDate = new Date(now.getTime() - 25 * 60 * 60 * 1000);
  
  const event = new Event(
    uuidv4(),
    uuidv4(), // Random Org ID
    'Feedback Test Party',
    pastDate,
    100,
    1000
  );
  
  await fork.persistAndFlush(event);
  console.log(`✅ Created Past Event: ${event.id} (${event.name})`);

  // 2. Create Ticket
  const ticket = new Ticket(
      uuidv4(),
      event.id,
      '33612345678', // Test Phone
      TicketStatus.USED,
      'hash123'
  );
  await fork.persistAndFlush(ticket);
  console.log(`✅ Created Ticket for Phone: ${ticket.attendeePhone}`);

  // 3. Run Use Case
  console.log('🔄 Running SendFeedbackRequestsUseCase...');
  await RequestContext.create(em, async () => {
    await useCase.execute();
  });

  // 4. Verify Event Status
  fork.clear(); // Clear identity map
  const updatedEvent = await fork.findOne(Event, { id: event.id });
  
  if (updatedEvent?.feedbackSent) {
      console.log('✅ Success: Event marked as feedbackSent = true');
      console.log('Test call count:', mockWhatsAppService.callCount);
  } else {
      console.error('❌ Failure: Event feedbackSent is false');
      process.exit(1);
  }

  // 4b. Test Feedback Receiving
  console.log('🔄 Testing FeedbackHandler...');
  const handler = app.get(FeedbackHandler);
  
  if (!handler) {
      console.error('❌ FeedbackHandler not found in context');
  } else {
      await RequestContext.create(em, async () => {
        await handler.handle(
            { rating: 5, comment: 'Super event!' }, 
            { 
              senderPhoneNumber: ticket.attendeePhone, 
              language: 'fr', 
              messageBody: 'Note 5', 
              organizationId: event.organizationId,
              messageId: 'msg_123'
            } as any
        );
      });
      console.log('✅ FeedbackHandler executed.');
      
      // Verify Persisted Feedback
      const verifyFork = em.fork(); 
      const feedbacks = await verifyFork.find(EventFeedback, { eventId: event.id });
      if (feedbacks.length > 0 && feedbacks[0].rating === 5) {
          console.log(`✅ Success: Feedback persisted! ID: ${feedbacks[0].id}, Rating: ${feedbacks[0].rating}`);
      } else {
          console.error('❌ Failure: Feedback not persisted.');
      }
  }

  // 5. Cleanup
  await fork.remove(ticket);
  await fork.remove(event);
  await fork.flush();

  await app.close();
}

bootstrap();
