import { Inject, Injectable } from '@nestjs/common';
import { IMessagingProvider } from '../../domain/ports/messaging-provider.interface';
import { IWhatsAppService, I_WHATSAPP_SERVICE } from '../../../common/whatsapp/whatsapp.service.interface';

@Injectable()
export class WhatsAppMessagingProvider implements IMessagingProvider {
  constructor(
    @Inject(I_WHATSAPP_SERVICE)
    private readonly whatsAppService: IWhatsAppService,
  ) {}

  async sendMagicLink(phoneNumber: string, link: string): Promise<void> {
    const message = `🔐 *Connexion Dashboard EventPilot*\n\nCliquez sur ce lien pour accéder à votre tableau de bord (Valide 15 min) :\n\n${link}\n\n_Si vous n'êtes pas à l'origine de cette demande, ignorez ce message._`;
    await this.whatsAppService.sendMessage(phoneNumber, message);
  }
}
