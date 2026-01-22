
import { Module } from '@nestjs/common';
import { WhatsAppController } from './application/controllers/whatsapp.controller';
import { TelegramController } from './application/controllers/telegram.controller';
import { ProcessMessageUseCase } from './application/use-cases/process-message.use-case';
import { ProcessTelegramMessageUseCase } from './application/use-cases/process-telegram-message.use-case';
import { ActionExecutionService } from './application/services/action-execution.service';
import { CommandIntentMapper } from './application/services/command-intent.mapper';
import { ConversationalGuidanceService } from './application/services/conversational-guidance.service';
import { ConversationStateService } from './application/services/conversation-state.service';
import { MessageExtractionService } from './application/services/message-extraction.service';
import { MediaStandardizationService } from './application/services/media-standardization.service';
import { TelegramParserService } from './infrastructure/telegram/telegram-parser.service';
import { WhatsAppParserService } from './infrastructure/whatsapp/whatsapp-parser.service';
import { TextMessageStrategy } from './application/strategies/text-message.strategy';
import { OrganizationModule } from '../organization/organization.module';
import { UserModule } from '../user/user.module';
import { TransactionModule } from '../transaction/transaction.module';
import { LLM_PROVIDER_TOKEN } from '../common/llm/llm-provider.interface';
import { GeminiLLMProvider } from '../common/llm/gemini-llm.provider';
import { PromptModule } from '../common/prompt/prompt.module';
import { BullModule } from '@nestjs/bullmq';
import { MessageProcessor } from './application/processors/message.processor';
import { TelegramMessageProcessor } from './application/processors/telegram-message.processor';
import { ReportModule } from '../report/report.module'; 
import { WhatsAppModule } from '../common/whatsapp/whatsapp.module';
import { TelegramModule } from '../common/telegram/telegram.module';
import { MessagingModule } from '../common/messaging/messaging.module';
import { LlmModule } from '../common/llm/llm.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { TicketingModule } from '../ticketing/ticketing.module'; 
import { PaymentModule } from '../payment/payment.module';
import { OnboardingModule } from '../onboarding/onboarding.module';
import { IncidentModule } from '../incident/incident.module';
import { AuthModule } from '../auth/auth.module';

import { CreateEventHandler } from './application/handlers/create-event.handler';
import { ScanTicketHandler } from './application/handlers/scan-ticket.handler';

import { GenerateClaimHandler } from './application/handlers/generate-claim.handler';
import { ClaimTicketHandler } from './application/handlers/claim-ticket.handler';
import { CheckStockHandler } from './application/handlers/check-stock.handler';
import { FeedbackHandler } from '../feedback/application/handlers/feedback.handler';
import { FeedbackModule } from '../feedback/feedback.module';
import { AudioMessageStrategy } from './application/strategies/audio-message.strategy';
import { ImageMessageStrategy } from './application/strategies/image-message.strategy';
import { DocumentMessageStrategy } from './application/strategies/document-message.strategy';
import { MESSAGE_STRATEGY_TOKEN } from './application/strategies/message-strategy.interface';
import { InteractiveMessageStrategy } from './application/strategies/interactive-message.strategy';

import { CreateTransactionHandler } from './application/handlers/create-transaction.handler';
import { AskDataHandler } from './application/handlers/ask-data.handler';
import { SwitchOrganizationHandler } from './application/handlers/switch-organization.handler';
import { NotImplementedHandler } from './application/handlers/not-implemented.handler';
import { GenerateReportHandler } from './application/handlers/generate-report.handler';
import { ActivateEventPassHandler } from './application/handlers/activate-event-pass.handler';
import { SubscribeHandler } from './application/handlers/subscribe.handler';
import { SubscribeMonthlyHandler } from './application/handlers/subscribe-monthly.handler';
import { ACTION_HANDLER_TOKEN } from './application/handlers/action-handler.interface';
import { GreetingHandler } from './application/handlers/greeting.handler';
import { CreateOrganizationHandler } from './application/handlers/create-organization.handler';
import { AddMemberHandler } from './application/handlers/add-member.handler';
import { HelpHandler } from './application/handlers/help.handler';
import { OnboardingHandler } from './application/handlers/onboarding.handler';
import { FeatureGuard } from '../common/guards/feature.guard';
import { UnknownIntentHandler } from './application/handlers/unknown-intent.handler';
import { ReportIncidentHandler } from './application/handlers/report-incident.handler';
import { CancelLastActionHandler } from './application/handlers/cancel-last-action.handler';
import { ExecuteDeletionHandler } from './application/handlers/execute-deletion.handler';
import { GenerateTicketsQRHandler } from './application/handlers/generate-tickets-qr.handler';
import { CancelDeletionHandler } from './application/handlers/cancel-deletion.handler';
import { RequestDashboardAccessHandler } from './application/handlers/request-dashboard-access.handler';
import { RequestScannerAccessHandler } from './application/handlers/request-scanner-access.handler';
import { DebtHandler } from './application/handlers/debt.handler';
import { ContactModule } from '../contact/contact.module';

@Module({
  imports: [
    BullModule.registerQueue({
        name: 'whatsapp',
    }),
    BullModule.registerQueue({
        name: 'telegram',
    }),
    UserModule,
    OrganizationModule, 
    TransactionModule, 
    PromptModule,
    ReportModule,
    WhatsAppModule,
    TelegramModule,
    MessagingModule,
    SubscriptionModule,
    TicketingModule,
    LlmModule,
    PaymentModule,
    FeedbackModule,
    OnboardingModule,
    IncidentModule,
    AuthModule,
    ContactModule,
  ],
  controllers: [WhatsAppController, TelegramController],
  providers: [
    ProcessMessageUseCase,
    ProcessTelegramMessageUseCase,
    ActionExecutionService,
    CommandIntentMapper,
    ConversationalGuidanceService,
    ConversationStateService,
    MessageExtractionService,
    MediaStandardizationService,
    TelegramParserService,
    WhatsAppParserService,
    MessageProcessor,
    TelegramMessageProcessor,
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
    SwitchOrganizationHandler,
    NotImplementedHandler,
    ActivateEventPassHandler,
    SubscribeHandler,
    AskDataHandler,
    GenerateReportHandler,
    GreetingHandler,
    CreateOrganizationHandler,
    AddMemberHandler,
    HelpHandler,
    CreateEventHandler,
    ScanTicketHandler,
    CheckStockHandler,
    GenerateClaimHandler,
    ClaimTicketHandler,
    OnboardingHandler,
    UnknownIntentHandler,
    ReportIncidentHandler,
    FeatureGuard,
    CancelLastActionHandler,
    ExecuteDeletionHandler,
    GenerateTicketsQRHandler,
    CancelDeletionHandler,
    RequestDashboardAccessHandler,
    RequestScannerAccessHandler,
    SubscribeMonthlyHandler,
    DebtHandler,
    {
      provide: ACTION_HANDLER_TOKEN,
      useFactory: (
        createOrg: CreateOrganizationHandler,
        addMember: AddMemberHandler,
        subscribe: SubscribeHandler,
        help: HelpHandler,
        greeting: GreetingHandler,
        createTx: CreateTransactionHandler,
        report: ReportIncidentHandler,
        askData: AskDataHandler,
        genReport: GenerateReportHandler,
        cancelAction: CancelLastActionHandler,
        createEvent: CreateEventHandler,
        genClaim: GenerateClaimHandler,
        claimTicket: ClaimTicketHandler,
        checkStock: CheckStockHandler,
        onboarding: OnboardingHandler,
        unknown: UnknownIntentHandler,
        switchOrg: SwitchOrganizationHandler,
        subscribeMonthly: SubscribeMonthlyHandler,
        dashboard: RequestDashboardAccessHandler,
        scannerAccess: RequestScannerAccessHandler,
        scanTicket: ScanTicketHandler,
        genQr: GenerateTicketsQRHandler,
        activatePass: ActivateEventPassHandler,
        execDel: ExecuteDeletionHandler,
        cancelDel: CancelDeletionHandler,
        debt: DebtHandler,
        feedback: FeedbackHandler,
      ) => [
        createOrg,
        addMember,
        subscribe,
        help,
        greeting,
        createTx,
        report,
        askData,
        genReport,
        cancelAction,
        createEvent,
        genClaim,
        claimTicket,
        checkStock,
        onboarding,
        unknown,
        switchOrg,
        subscribeMonthly,
        dashboard,
        scannerAccess,
        scanTicket,
        genQr,
        activatePass,
        execDel,
        cancelDel,
        debt,
        feedback,
      ],
      inject: [
        CreateOrganizationHandler,
        AddMemberHandler,
        SubscribeHandler,
        HelpHandler,
        GreetingHandler,
        CreateTransactionHandler,
        ReportIncidentHandler,
        AskDataHandler,
        GenerateReportHandler,
        CancelLastActionHandler,
        CreateEventHandler,
        GenerateClaimHandler,
        ClaimTicketHandler,
        CheckStockHandler,
        OnboardingHandler,
        UnknownIntentHandler,
        SwitchOrganizationHandler,
        SubscribeMonthlyHandler,
        RequestDashboardAccessHandler,
        RequestScannerAccessHandler,
        ScanTicketHandler,
        GenerateTicketsQRHandler,
        ActivateEventPassHandler,
        ExecuteDeletionHandler,
        CancelDeletionHandler,
        DebtHandler,
        FeedbackHandler,
      ],
    }
  ],
})
export class WebhookModule {}
