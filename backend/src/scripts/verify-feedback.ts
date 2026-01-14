
import { Test, TestingModule } from '@nestjs/testing';
import { FeedbackHandler } from '../feedback/application/handlers/feedback.handler';
import { I_WHATSAPP_SERVICE, IWhatsAppService } from '../common/whatsapp/whatsapp.service.interface';
import { I_EVENT_FEEDBACK_REPOSITORY, IEventFeedbackRepository } from '../feedback/domain/ports/event-feedback.repository.interface';
import { I_TICKET_REPOSITORY, ITicketRepository } from '../ticketing/domain/ports/ticket.repository.interface';
import { Ticket, TicketStatus } from '../ticketing/domain/ticket.entity';
import { EventFeedback } from '../feedback/domain/event-feedback.entity';
import { ActionContext } from '../webhook/application/handlers/action-handler.interface';

// --- MOCKS ---

class MockWhatsAppService implements IWhatsAppService {
  async sendMessage(to: string, message: string) {
    console.log(`[WhatsApp] To ${to}: ${message}`);
  }
  async sendInteractiveMessage() {}
  async sendDocument() {}
  async downloadMedia() { return { buffer: Buffer.from(''), mimeType: 'image/jpeg' }; }
  async markMessageAsRead() {}
  async sendInteractiveButtons() {}
  async sendInteractiveList() {}
}

class MockEventFeedbackRepository implements IEventFeedbackRepository {
  public feedbacks: EventFeedback[] = [];
  async create(feedback: EventFeedback) {
    console.log(`[FeedbackRepo] Created feedback for Event ${feedback.eventId}: Rating ${feedback.rating}`);
    this.feedbacks.push(feedback);
  }
  async findByEventId() { return []; }
  async findByUserAndEvent() { return null; }
}

class MockTicketRepository implements ITicketRepository {
  private tickets: Ticket[] = [];

  async save(ticket: Ticket) { this.tickets.push(ticket); }
  async findById() { return null; }
  async findByEventId() { return []; }
  async findByToken() { return null; }

  // THE CORE LOGIC TO VERIFY
  async findLastTicketForPhone(phone: string): Promise<Ticket | null> {
    const candidates = this.tickets.filter(t => 
        t.attendeePhone === phone && 
        (t.status === TicketStatus.USED || t.status === TicketStatus.VALID)
    );

    // Sort: USED (Recent) > VALID (Recent)
    candidates.sort((a, b) => {
        const timeA = a.usedAt ? a.usedAt.getTime() : a.createdAt.getTime();
        const timeB = b.usedAt ? b.usedAt.getTime() : b.createdAt.getTime();
        
        // Priority to USED status? 
        // Logic in MicroOrm repo was: orderBy: { usedAt: 'DESC', createdAt: 'DESC' }
        // Postgres sorts nulls last usually for DESC, userAt is null for VALID.
        // So USED tickets come first.
        
        if (a.status === TicketStatus.USED && b.status !== TicketStatus.USED) return -1;
        if (b.status === TicketStatus.USED && a.status !== TicketStatus.USED) return 1;
        
        return timeB - timeA; // Descending time
    });

    return candidates.length > 0 ? candidates[0] : null;
  }
}

// --- RUNNER ---

async function run() {
  console.log('🚀 Starting Feedback Logic Verification...');

  const module: TestingModule = await Test.createTestingModule({
    providers: [
      FeedbackHandler,
      { provide: I_WHATSAPP_SERVICE, useClass: MockWhatsAppService },
      { provide: I_EVENT_FEEDBACK_REPOSITORY, useClass: MockEventFeedbackRepository },
      { provide: I_TICKET_REPOSITORY, useClass: MockTicketRepository },
    ],
  }).compile();

  const handler = module.get(FeedbackHandler);
  const ticketRepo = module.get<MockTicketRepository>(I_TICKET_REPOSITORY); // Cast to Mock to access 'save'

  const userPhone = '+33612345678';

  // 1. Setup Tickets
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);

  // Event A (Past, Used)
  const ticketPast = new Ticket('t1', 'EVENT_PAST_ID', userPhone, TicketStatus.USED, 'hash1', new Date(), yesterday);
  // Event B (Future, Valid)
  const ticketFuture = new Ticket('t2', 'EVENT_FUTURE_ID', userPhone, TicketStatus.VALID, 'hash2', tomorrow);

  await ticketRepo.save(ticketPast);
  await ticketRepo.save(ticketFuture);

  console.log('✅ Tickets setup: 1 Past (USED), 1 Future (VALID)');

  // 2. Simulate User Feedback
  const context: ActionContext = {
    senderPhoneNumber: userPhone,
    messageBody: '5',
    messageId: 'msg_123',
    organizationId: null,
    language: 'fr'
  };

  const data = { rating: 5, comment: 'Great!' };

  console.log('Sending Feedback...');
  await handler.handle(data, context);

  // 3. Verify Repository state
  const feedbackRepo = module.get<MockEventFeedbackRepository>(I_EVENT_FEEDBACK_REPOSITORY);
  
  if (feedbackRepo.feedbacks.length === 0) {
      console.error('❌ No feedback created.');
      process.exit(1);
  }

  const createdFeedback = feedbackRepo.feedbacks[0];
  console.log(`\nCreated Feedback for Event ID: ${createdFeedback.eventId}`);

  if (createdFeedback.eventId === 'EVENT_PAST_ID') {
      console.log('✅ SUCCESS: Feedback linked to the PAST event.');
  } else {
      console.error(`❌ FAILURE: Feedback linked to ${createdFeedback.eventId} (Expected EVENT_PAST_ID)`);
      process.exit(1);
  }
}

run();
