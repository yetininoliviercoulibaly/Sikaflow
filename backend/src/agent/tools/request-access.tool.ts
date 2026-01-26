import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { BaseTool } from './base.tool';
import { RequestMagicLinkUseCase } from '../../auth/application/use-cases/request-magic-link.use-case';
import { TelegramMessagingAdapter } from '../../common/messaging/telegram-messaging.adapter';

@Injectable()
export class RequestAccessTool extends BaseTool<any> {
  name = 'request_access';
  description = 'Requests a secure access link (magic link) for the dashboard or ticket scanner.';
  
  schema = z.object({
    phoneNumber: z.string().describe('The phone number of the user requesting access.'),
    type: z.enum(['dashboard', 'scanner']).describe('The type of access needed.'),
  });

  constructor(
      private readonly requestMagicLinkUseCase: RequestMagicLinkUseCase,
      private readonly telegramMessagingAdapter: TelegramMessagingAdapter
  ) {
    super();
  }

  protected async _call(input: z.infer<typeof this.schema>): Promise<string> {
    return this.handleSafe(async () => {
        await this.requestMagicLinkUseCase.execute(input.phoneNumber, this.telegramMessagingAdapter, input.type);
        return `A secure access link for the ${input.type} has been sent to ${input.phoneNumber}.`;
    });
  }
}
