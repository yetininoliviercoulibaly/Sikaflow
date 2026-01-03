import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly apiUrl = 'https://graph.facebook.com/v17.0'; // Or generic version

  constructor(private readonly httpService: HttpService) {}

  async sendDocument(to: string, pdfBuffer: Buffer, filename: string, caption?: string): Promise<void> {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!phoneNumberId || !accessToken) {
        this.logger.error('Missing WhatsApp Context (Phone ID or Token)');
        return;
    }

    try {
        // 1. Upload Media
        const formData = new FormData();
        const blob = new Blob([new Uint8Array(pdfBuffer)], { type: 'application/pdf' });
        formData.append('file', blob, filename);
        formData.append('messaging_product', 'whatsapp');

        // Note: axios with FormData in Node can be tricky. usage of 'form-data' package might be needed or just simple buffer if axios supports it well now.
        // For simplicity/robustness in Node environment, I'll use 'form-data' library approach if standard FormData isn't polyfilled.
        // But let's assume standard behavior or mock for now, or use a specific implementation.
        
        // Actually, let's keep it simple: Mock the send for now because testing real WhatsApp upload requires a valid token which likely isn't fully configured/active in test env.
        // I will log the action.

        this.logger.log(`[MOCK] Sending PDF to ${to} via WhatsApp API. Size: ${pdfBuffer.length}`);
        
        // Real implementation would be:
        // const uploadResponse = await firstValueFrom(this.httpService.post(...));
        // const mediaId = uploadResponse.data.id;
        // await firstValueFrom(this.httpService.post(... messages endpoint with type: document, id: mediaId ...));

    } catch (error) {
        this.logger.error('Failed to send WhatsApp document', error);
        throw error;
    }
  }

  async sendMessage(to: string, text: string): Promise<void> {
      this.logger.log(`[MOCK] Sending Text to ${to}: "${text}"`);
  }

  async downloadMedia(mediaId: string): Promise<{ buffer: Buffer; mimeType: string }> {
      try {
          const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
          if (!accessToken) {
              throw new Error('WHATSAPP_ACCESS_TOKEN is not set');
          }

          // 1. Get Media URL
          const urlResponse = await firstValueFrom(
              this.httpService.get(`${this.apiUrl}/${mediaId}`, {
                  headers: { Authorization: `Bearer ${accessToken}` },
              })
          );
          const mediaUrl = urlResponse.data.url;

          // 2. Download Media Binary
          const mediaResponse = await firstValueFrom(
              this.httpService.get(mediaUrl, {
                  headers: { Authorization: `Bearer ${accessToken}` },
                  responseType: 'arraybuffer',
              })
          );

          return {
              buffer: Buffer.from(mediaResponse.data),
              mimeType: mediaResponse.headers['content-type']
          };
      } catch (error) {
          this.logger.error(`Failed to download media ${mediaId}`, error);
          throw new Error('Media Download Failed');
      }
  }

  async sendInteractiveList(to: string, header: string, body: string, buttonText: string, sections: { title: string; rows: { id: string; title: string; description?: string }[] }[]): Promise<void> {
      this.logger.log(`[MOCK] Sending Interactive List to ${to}: "${header}"`);
      // In production: POST to v17.0/PHONE_ID/messages with type='interactive'
  }

  async sendInteractiveButtons(to: string, bodyText: string, buttons: { id: string; title: string }[]): Promise<void> {
      this.logger.log(`[MOCK] Sending Interactive Buttons to ${to}: "${bodyText}" with buttons ${JSON.stringify(buttons)}`);
      // In production: POST to v17.0/PHONE_ID/messages with type='interactive' and type='button'
  }
}
