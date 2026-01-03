import { Module } from '@nestjs/common';
import { WhatsAppController } from './application/controllers/whatsapp.controller';
import { ProcessMessageUseCase } from './application/use-cases/process-message.use-case';
import { OrganizationModule } from '../organization/organization.module';
import { UserModule } from '../user/user.module';
import { TransactionModule } from '../transaction/transaction.module';
import { LLM_PROVIDER_TOKEN } from '../common/llm/llm-provider.interface';
import { GeminiLLMProvider } from '../common/llm/gemini-llm.provider';
import { PromptModule } from '../common/prompt/prompt.module';
import { BullModule } from '@nestjs/bullmq';
import { MessageProcessor } from './application/processors/message.processor';
import { ReportModule } from '../report/report.module'; // Import to get 'reports' queue
import { WhatsAppModule } from '../common/whatsapp/whatsapp.module';
import { SubscriptionModule } from '../subscription/subscription.module';

import { TextMessageStrategy } from './application/strategies/text-message.strategy';
import { AudioMessageStrategy } from './application/strategies/audio-message.strategy';
import { ImageMessageStrategy } from './application/strategies/image-message.strategy';
import { DocumentMessageStrategy } from './application/strategies/document-message.strategy';
import { MESSAGE_STRATEGY_TOKEN } from './application/strategies/message-strategy.interface';
// Handlers
// Handlers
import { CreateTransactionHandler } from './application/handlers/create-transaction.handler';
import { AskDataHandler } from './application/handlers/ask-data.handler';
import { SwitchOrganizationHandler } from './application/handlers/switch-organization.handler';
import { NotImplementedHandler } from './application/handlers/not-implemented.handler';
import { GenerateReportHandler } from './application/handlers/generate-report.handler';
import { ActivateEventPassHandler } from './application/handlers/activate-event-pass.handler';
import { ACTION_HANDLER_TOKEN } from './application/handlers/action-handler.interface';
import { InteractiveMessageStrategy } from './application/strategies/interactive-message.strategy';

@Module({
  imports: [
    BullModule.registerQueue({
        name: 'whatsapp',
    }),
    UserModule,
    OrganizationModule, // To resolve context if logic moves here
    TransactionModule, // To create transactions
    PromptModule,
    ReportModule,
    WhatsAppModule,
    SubscriptionModule,
  ],
  controllers: [WhatsAppController],
  providers: [
    ProcessMessageUseCase,
    MessageProcessor,
    {
      provide: LLM_PROVIDER_TOKEN,
      useClass: GeminiLLMProvider,
    },
    TextMessageStrategy,
    AudioMessageStrategy,
    ImageMessageStrategy,
    DocumentMessageStrategy,
    InteractiveMessageStrategy,
    {
        provide: MESSAGE_STRATEGY_TOKEN,
        useFactory: (...strategies) => strategies,
        inject: [
            TextMessageStrategy, 
            AudioMessageStrategy, 
            ImageMessageStrategy, 
            DocumentMessageStrategy,
            InteractiveMessageStrategy
        ], 
    },
    // Action Handlers
    CreateTransactionHandler,
    AskDataHandler,
    GenerateReportHandler,
    SwitchOrganizationHandler,
    NotImplementedHandler,
    ActivateEventPassHandler,
    {
        provide: ACTION_HANDLER_TOKEN,
        useFactory: (...handlers) => handlers,
        inject: [
            CreateTransactionHandler, 
            AskDataHandler, 
            GenerateReportHandler, 
            SwitchOrganizationHandler, 
            ActivateEventPassHandler,
            NotImplementedHandler
        ]
    }
  ],
})
export class WebhookModule {}
