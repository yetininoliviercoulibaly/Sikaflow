import { Inject, Injectable } from '@nestjs/common';
import { v4 } from 'uuid';
import { MagicLinkToken } from '../../domain/magic-link-token.entity';
import { IAuthRepository, I_AUTH_REPOSITORY } from '../../domain/ports/auth.repository.interface';
import { IMessagingProvider, I_MESSAGING_PROVIDER } from '../../domain/ports/messaging-provider.interface';

@Injectable()
export class RequestMagicLinkUseCase {
  private readonly EXPIRATION_MINUTES = 15;

  constructor(
    @Inject(I_AUTH_REPOSITORY)
    private readonly authRepository: IAuthRepository,
    @Inject(I_MESSAGING_PROVIDER)
    private readonly messagingProvider: IMessagingProvider,
  ) {}

  async execute(phoneNumber: string): Promise<void> {
    // 1. Generate Token
    const token = v4();
    const expiresAt = new Date(Date.now() + this.EXPIRATION_MINUTES * 60 * 1000);

    const magicLinkToken = new MagicLinkToken(token, phoneNumber, expiresAt);

    // 2. Save Token
    await this.authRepository.save(magicLinkToken);

    // 3. Generate Link (Assuming frontend URL is configured in env)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const link = `${frontendUrl}/auth/verify?token=${token}`;

    // 4. Send via WhatsApp
    await this.messagingProvider.sendMagicLink(phoneNumber, link);
  }
}
