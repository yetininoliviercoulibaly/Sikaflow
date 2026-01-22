import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { BaseTool } from './base.tool';
import { ClaimTicketUseCase } from '../../ticketing/application/use-cases/claim-ticket.use-case';
import { TelegramMessagingAdapter } from '../../common/messaging/telegram-messaging.adapter';

@Injectable()
export class ClaimTicketTool extends BaseTool<any> {
  name = 'claim_ticket';
  description = 'Allows a user to claim a ticket using a claim token (e.g., CLAIM-XXXX).';
  
  schema = z.object({
    token: z.string().describe('The claim token.'),
    userPhone: z.string().describe('The phone number of the user claiming the ticket.'),
  });

  constructor(
      private readonly claimTicketUseCase: ClaimTicketUseCase,
      private readonly telegramMessagingAdapter: TelegramMessagingAdapter
  ) {
    super();
  }

  protected async _call(input: z.infer<typeof this.schema>): Promise<string> {
    return this.handleSafe(async () => {
        await this.claimTicketUseCase.execute(input.token, input.userPhone, this.telegramMessagingAdapter);
        return `Ticket for token ${input.token} has been successfully claimed and sent to you.`;
    });
  }
}
