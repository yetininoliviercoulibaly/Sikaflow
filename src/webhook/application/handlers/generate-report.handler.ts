import { Injectable } from '@nestjs/common';
import { IActionHandler, ActionContext } from './action-handler.interface';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class GenerateReportHandler implements IActionHandler {
    constructor(
        @InjectQueue('reports') private readonly reportsQueue: Queue,
    ) {}

    canHandle(intent: string): boolean {
        return intent === 'GENERATE_REPORT';
    }

    async handle(data: any, context: ActionContext): Promise<void> {
        // Enqueue Job for Async Generation
        await this.reportsQueue.add('generate-report', {
            phoneNumber: context.senderPhoneNumber,
            organizationId: null, // TODO: Resolve Context
            type: data?.type || 'FLASH'
        });
        // Note: We don't send a confirmation message here, 
        // the ReportProcessor could send "Starting..." or just the final PDF.
        // Or we could send "Report generation started..." here.
    }
}
