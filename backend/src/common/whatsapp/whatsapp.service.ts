import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { IWhatsAppService } from './whatsapp.service.interface';

@Injectable()
export class WhatsAppService implements IWhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly apiUrl = 'https://graph.facebook.com/v22.0';

  constructor(private readonly httpService: HttpService) {}

  private get headers() {
    return {
      Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    };
  }

  private get phoneNumberId() {
    return process.env.WHATSAPP_PHONE_NUMBER_ID;
  }

  async sendDocument(to: string, pdfBuffer: Buffer, filename: string, caption?: string): Promise<void> {
    if (!this.phoneNumberId) throw new Error('WHATSAPP_PHONE_NUMBER_ID is not set');

    try {
      // 1. Upload Media
      const formData = new FormData();
      const blob = new Blob([new Uint8Array(pdfBuffer)], { type: 'application/pdf' });
      formData.append('file', blob, filename);
      formData.append('messaging_product', 'whatsapp');

      const uploadResponse = await firstValueFrom(
        this.httpService.post(`${this.apiUrl}/${this.phoneNumberId}/media`, formData, {
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
            // Content-Type is handled automatically by FormData/Blob (browser-like env)
            // But in Node with 'axios', standard FormData might behave differently.
            // Using standard 'form-data' package logic if mapped correctly. 
            // In NestJS/Node 18+, global FormData/Blob exists but verify compatibility.
          },
        })
      );

      const mediaId = uploadResponse.data.id;

      // 2. Send Message with Media ID
      await this.sendMessagePayload(to, {
        type: 'document',
        document: {
          id: mediaId,
          caption: caption,
          filename: filename
        }
      });

      this.logger.log(`Document sent to ${to}`);
    } catch (error) {
      this.logger.error('Failed to send WhatsApp document', error.response?.data || error.message);
      throw error;
    }
  }

  async sendMessage(to: string, text: string): Promise<void> {
    await this.sendMessagePayload(to, {
      type: 'text',
      text: { body: text },
    });
  }

  async sendInteractiveList(
    to: string,
    header: string,
    body: string,
    buttonText: string,
    sections: { title: string; rows: { id: string; title: string; description?: string }[] }[],
  ): Promise<void> {
    await this.sendMessagePayload(to, {
      type: 'interactive',
      interactive: {
        type: 'list',
        header: { type: 'text', text: header },
        body: { text: body },
        footer: { text: 'SikaFlow' },
        action: {
          button: buttonText,
          sections: sections.map(s => ({
            title: s.title,
            rows: s.rows.map(r => ({
              id: r.id,
              title: r.title,
              description: r.description
            }))
          }))
        }
      }
    });
  }

  async sendInteractiveButtons(to: string, bodyText: string, buttons: { id: string; title: string }[]): Promise<void> {
    await this.sendMessagePayload(to, {
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: bodyText },
        action: {
          buttons: buttons.map(b => ({
            type: 'reply',
            reply: {
              id: b.id,
              title: b.title
            }
          }))
        }
      }
    });
  }

  private async sendMessagePayload(to: string, content: any): Promise<void> {
    if (!this.phoneNumberId) throw new Error('WHATSAPP_PHONE_NUMBER_ID is not set');
    
    // Ensure 'to' number format (remove + if present, ensures digits)
    const recipient = to.replace(/\+/g, '');

    const payload = {
      messaging_product: 'whatsapp',
      to: recipient,
      ...content
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.apiUrl}/${this.phoneNumberId}/messages`,
          payload,
          { headers: this.headers }
        )
      );
      this.logger.log(`Message sent to ${to} type=${content.type}. Meta Response: ${JSON.stringify(response.data)}`);
    } catch (error) {
      this.logger.error(`Failed to send message to ${to}`, error.response?.data || error.message);
      throw error;
    }
  }

  async downloadMedia(mediaId: string): Promise<{ buffer: Buffer; mimeType: string }> {
      try {
          const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
          if (!accessToken) throw new Error('WHATSAPP_ACCESS_TOKEN is not set');

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
}
