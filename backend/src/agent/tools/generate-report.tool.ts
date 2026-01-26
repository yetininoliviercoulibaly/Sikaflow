import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { BaseTool } from './base.tool';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class GenerateReportTool extends BaseTool<any> {
  name = 'generate_report';
  description = 'Requests the generation of a financial or activity report (PDF).';
  
  schema = z.object({
    organizationId: z.string().optional().describe('The ID of the organization.'),
    phoneNumber: z.string().describe('The phone number where the report should be sent.'),
    type: z.enum(['FLASH', 'WEEKLY', 'MONTHLY']).optional().default('FLASH').describe('The type of report.'),
    platform: z.string().optional().default('TELEGRAM').describe('The messaging platform.'),
  });

  constructor(@InjectQueue('reports') private readonly reportsQueue: Queue) {
    super();
  }

  protected async _call(input: z.infer<typeof this.schema>): Promise<string> {
    return this.handleSafe(async () => {
        await this.reportsQueue.add('generate-report', {
            phoneNumber: input.phoneNumber,
            organizationId: input.organizationId || null,
            type: input.type,
            platform: input.platform
        });
        return `Report (${input.type}) generation request has been enqueued. You will receive it shortly.`;
    });
  }
}
