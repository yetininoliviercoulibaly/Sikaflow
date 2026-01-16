import { Inject, Injectable } from '@nestjs/common';
import {
  IMessagingService,
  IMessageButton,
  IMessageSection,
} from './messaging.service.interface';
import { IWhatsAppService, I_WHATSAPP_SERVICE } from '../whatsapp/whatsapp.service.interface';

/**
 * WhatsApp implementation of the platform-agnostic messaging service
 */
@Injectable()
export class WhatsAppMessagingAdapter implements IMessagingService {
  constructor(
    @Inject(I_WHATSAPP_SERVICE)
    private readonly whatsAppService: IWhatsAppService,
  ) {}

  async sendMessage(to: string, text: string): Promise<void> {
    await this.whatsAppService.sendMessage(to, text);
  }

  async sendDocument(
    to: string,
    buffer: Buffer,
    filename: string,
    caption?: string,
  ): Promise<void> {
    await this.whatsAppService.sendDocument(to, buffer, filename, caption);
  }

  async sendInteractiveButtons(
    to: string,
    bodyText: string,
    buttons: IMessageButton[],
  ): Promise<void> {
    await this.whatsAppService.sendInteractiveButtons(to, bodyText, buttons);
  }

  async sendInteractiveList(
    to: string,
    header: string,
    body: string,
    buttonText: string,
    sections: IMessageSection[],
  ): Promise<void> {
    await this.whatsAppService.sendInteractiveList(to, header, body, buttonText, sections);
  }

  async downloadMedia(mediaId: string): Promise<{ buffer: Buffer; filename?: string }> {
    return this.whatsAppService.downloadMedia(mediaId);
  }
}
