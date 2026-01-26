import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { BaseTool } from './base.tool';
import { SubscribeUseCase } from '../../subscription/application/use-cases/subscribe.use-case';

@Injectable()
export class SubscribeTool extends BaseTool<any> {
  name = 'subscribe_organization';
  description = 'Subscribes an organization to a plan (e.g., PREMIUM, FREE) using a payment method.';
  
  schema = z.object({
    organizationId: z.string().describe('The ID of the organization to subscribe.'),
    planId: z.string().describe('The ID of the subscription plan.'),
    paymentMethodId: z.string().optional().describe('The ID of the payment method to use.'),
  });

  constructor(private readonly subscribeUseCase: SubscribeUseCase) {
    super();
  }

  protected async _call(input: z.infer<typeof this.schema>): Promise<string> {
    return this.handleSafe(async () => {
        const result = await this.subscribeUseCase.execute(input.planId, input.organizationId);
        return `Subscription initiated. Please complete payment using this link: ${result.paymentLink}`;
    });
  }
}
