import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MikroOrmEventFeedbackRepository } from './infrastructure/persistence/mikro-orm-event-feedback.repository';
import { I_EVENT_FEEDBACK_REPOSITORY } from './domain/ports/event-feedback.repository.interface';
import { SendFeedbackRequestsUseCase } from './application/use-cases/send-feedback-requests.use-case';
import { FeedbackHandler } from './application/handlers/feedback.handler';
import { TicketingModule } from '../ticketing/ticketing.module';
import { WhatsAppModule } from '../common/whatsapp/whatsapp.module';
import { EventFeedbackSchema } from './infrastructure/persistence/event-feedback.schema';
import { FeedbackScheduler } from './application/schedulers/feedback.scheduler';

@Module({
  imports: [
    MikroOrmModule.forFeature([EventFeedbackSchema]),
    TicketingModule,
    WhatsAppModule,
  ],
  providers: [
    {
      provide: I_EVENT_FEEDBACK_REPOSITORY,
      useClass: MikroOrmEventFeedbackRepository,
    },
    SendFeedbackRequestsUseCase,
    FeedbackHandler,
    FeedbackScheduler,
  ],
  exports: [I_EVENT_FEEDBACK_REPOSITORY, SendFeedbackRequestsUseCase, FeedbackHandler],
})
export class FeedbackModule {}
