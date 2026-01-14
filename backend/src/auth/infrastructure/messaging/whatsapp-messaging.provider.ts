import { Inject, Injectable } from '@nestjs/common';
import { IMessagingProvider } from '../../domain/ports/messaging-provider.interface';
import { IWhatsAppService, I_WHATSAPP_SERVICE } from '../../../common/whatsapp/whatsapp.service.interface';

@Injectable()
export class WhatsAppMessagingProvider implements IMessagingProvider {
  constructor(
    @Inject(I_WHATSAPP_SERVICE)
    private readonly whatsAppService: IWhatsAppService,
  ) {}

  async sendMagicLink(phoneNumber: string, link: string, language?: string): Promise<void> {
    const isEn = language === 'en';
    
    const message = isEn
      ? `🔐 *SikaFlow Dashboard Login*\n\nClick this link to access your dashboard (Valid for 15 min):\n\n${link}\n\n_If you did not request this, please ignore this message._`
      : `🔐 *Connexion Dashboard SikaFlow*\n\nCliquez sur ce lien pour accéder à votre tableau de bord (Valide 15 min) :\n\n${link}\n\n_Si vous n'êtes pas à l'origine de cette demande, ignorez ce message._`;
    
    await this.whatsAppService.sendMessage(phoneNumber, message);
  }
}
