import { Inject, Injectable, Logger } from '@nestjs/common';
import { WhatsAppPayloadDto } from '../dtos/whatsapp-payload.dto';
import { IMessageStrategy, MESSAGE_STRATEGY_TOKEN } from '../strategies/message-strategy.interface';
import { IUserRepository, I_USER_REPOSITORY } from '../../../user/domain/ports/user.repository.interface';
import { WhatsAppMessagingAdapter } from '../../../common/messaging/whatsapp-messaging.adapter';
import { ActionExecutionService } from '../services/action-execution.service';

@Injectable()
export class ProcessMessageUseCase {
  private readonly logger = new Logger(ProcessMessageUseCase.name);

  constructor(
    @Inject(MESSAGE_STRATEGY_TOKEN)
    private readonly strategies: IMessageStrategy[],
    private readonly whatsAppMessagingAdapter: WhatsAppMessagingAdapter,
    @Inject(I_USER_REPOSITORY) private readonly userRepository: IUserRepository,
    private readonly actionExecutionService: ActionExecutionService,
  ) {}

  async execute(payload: WhatsAppPayloadDto): Promise<void> {
    const entry = payload.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;
    const statuses = value?.statuses;
    
    if (statuses && statuses.length > 0) {
        this.logger.log(`Received status update from Meta: ${JSON.stringify(statuses)}`);
        return;
    }

    if (!messages || messages.length === 0) {
      this.logger.debug('No messages or statuses found in payload');
      return;
    }

    for (const message of messages) {
      const from = message.from; 
      const messageId = message.id;

      try {
        // 1. Find Strategy
        const strategy = this.strategies.find(s => s.canHandle(message));
        if (!strategy) {
             this.logger.warn(`No strategy found for message type: ${message.type}`);
             continue;
        }

        // Check for specific Regex patterns (Bypass LLM for Claim Links)
        let analysis: any = null;
        if (message.type === 'text' && message.text?.body?.startsWith('CLAIM-')) {
             analysis = {
                 intent: 'CLAIM_TICKET',
                 data: { token: message.text.body },
                 actions: [{ intent: 'CLAIM_TICKET', data: { raw_message: message.text.body } }]
             };
        } else {
             // 2. Process via Strategy (LLM)
             analysis = await strategy.process(message, from);
        }
        
        if (!analysis) {
             this.logger.warn(`Analysis failed or was skipped via strategy for message ${messageId}`);
             continue;
        }
        
        this.logger.log(`Analysis for ${from}: ${JSON.stringify(analysis)}`);

        // 3. Normalize Actions
        const actions = analysis.actions || (analysis.intent ? [{ intent: analysis.intent, data: analysis.data }] : []);

        // 4. Fetch User
        const user = await this.userRepository.findByPhoneNumber(from);

        // 5. Execute Actions via Service
        await this.actionExecutionService.execute({
            actions,
            messagingService: this.whatsAppMessagingAdapter,
            user,
            senderPhoneNumber: from,
            messageId,
            messageBody: message.type === 'text' && message.text ? message.text.body : undefined,
            platform: 'whatsapp'
        });

      } catch (error) {
        this.logger.error(`Error processing message ${messageId} from ${from}`, error);
      }
    }
  }
}
