import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { BaseTool } from './base.tool';
import { ScanTicketUseCase } from '../../ticketing/application/use-cases/scan-ticket.use-case';

@Injectable()
export class ScanTicketTool extends BaseTool<any> {
  name = 'scan_ticket';
  description = 'Processes a ticket QR code (usually from an image or token) to validate entry.';
  
  schema = z.object({
    mediaBase64: z.string().describe('The Base64 encoded image content of the ticket QR code.'),
    mimeType: z.string().describe('The mime type of the image (e.g., image/jpeg).'),
    scannerPhone: z.string().describe('The phone number of the person scanning (the user).'),
  });

  constructor(private readonly scanTicketUseCase: ScanTicketUseCase) {
    super();
  }

  protected async _call(input: z.infer<typeof this.schema>): Promise<string> {
    return this.handleSafe(async () => {
        const buffer = Buffer.from(input.mediaBase64, 'base64');
        const result = await this.scanTicketUseCase.execute(buffer, input.mimeType, input.scannerPhone);
        return result;
    });
  }
}
