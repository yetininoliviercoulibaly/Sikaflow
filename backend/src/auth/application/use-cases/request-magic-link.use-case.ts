import { Inject, Injectable } from '@nestjs/common';
import { v4 } from 'uuid';
import { MagicLinkToken } from '../../domain/magic-link-token.entity';
import { IAuthRepository, I_AUTH_REPOSITORY } from '../../domain/ports/auth.repository.interface';
import { IMessagingProvider, I_MESSAGING_PROVIDER } from '../../domain/ports/messaging-provider.interface';
import { IMessagingService } from '../../../common/messaging/messaging.service.interface';
@Injectable()
export class RequestMagicLinkUseCase {
  private readonly EXPIRATION_MINUTES = 15;

  constructor(
    @Inject(I_AUTH_REPOSITORY)
    private readonly authRepository: IAuthRepository,
    @Inject(I_MESSAGING_PROVIDER)
    private readonly messagingProvider: IMessagingProvider,
  ) {}

  async execute(
    phoneNumber: string, 
    messagingService?: IMessagingService,
    targetApp: 'dashboard' | 'scanner' = 'dashboard'
  ): Promise<void> {
    // 1. Generate Token
    const token = v4();
    const expiresAt = new Date(Date.now() + this.EXPIRATION_MINUTES * 60 * 1000);

    const magicLinkToken = new MagicLinkToken(token, phoneNumber, expiresAt);

    // 2. Save Token
    await this.authRepository.save(magicLinkToken);

    // 3. Generate Link based on Target App
    const dashboardUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const scannerUrl = process.env.SCANNER_URL || dashboardUrl; // Fallback to dashboard if not set
    
    const baseUrl = targetApp === 'scanner' ? scannerUrl : dashboardUrl;
    // Note: Scanner might use different route or query param if it's SPA.
    // Assuming Scanner PWA root handles ?token= (which we implemented)
    // Dashboard handles /auth/verify?token=
    
    let link = '';
    let appLabel = '';
    if (targetApp === 'scanner') {
        // Scanner PWA usually sits at root. We implemented api.ts to read ?token= from root.
        link = `${baseUrl}/?token=${token}`;
        appLabel = 'Scanner';
    } else {
        link = `${baseUrl}/auth/verify?token=${token}`;
        appLabel = 'Tableau de bord';
    }

    // 4. Send Message
    if (messagingService && typeof messagingService.sendMessage === 'function') {
        // Use the provided service (context-aware)
        // We construct the message here because generic service doesn't know about "Magic Link" template
        const message = `🔐 *Connexion SikaFlow*\n\nCliquez sur ce lien pour accéder à votre ${appLabel} :\n\n[Accéder au ${appLabel}](${link})\n\n_Ce lien expire dans 15 minutes._`;
        await messagingService.sendMessage(phoneNumber, message);
    } else {
        // Fallback to default provider (legacy/http flow)
        await this.messagingProvider.sendMagicLink(phoneNumber, link);
    }
  }
}
