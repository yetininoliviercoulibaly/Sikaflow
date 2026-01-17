import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';

/**
 * Guard to verify Telegram webhook requests
 * 
 * Telegram uses a simpler verification method than WhatsApp:
 * - When setting up webhook via setWebhook API, you can specify a secret_token
 * - Telegram will send this token in the X-Telegram-Bot-Api-Secret-Token header
 * 
 * @see https://core.telegram.org/bots/api#setwebhook
 */
@Injectable()
export class TelegramSignatureGuard implements CanActivate {
  private readonly logger = new Logger(TelegramSignatureGuard.name);

  canActivate(context: ExecutionContext): boolean {
    // Check if verification is enabled (default: enabled)
    const shouldVerify = process.env.TELEGRAM_VERIFY_SIGNATURE !== 'false';

    if (!shouldVerify) {
      this.logger.warn('Telegram Signature Verification BYPASSED via env var.');
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const secretToken = request.headers['x-telegram-bot-api-secret-token'];
    const expectedToken = process.env.TELEGRAM_WEBHOOK_SECRET;

    if (!expectedToken) {
      this.logger.error('TELEGRAM_WEBHOOK_SECRET is not defined in environment variables.');
      throw new ForbiddenException('Server configuration error');
    }

    if (!secretToken) {
      this.logger.warn('Missing X-Telegram-Bot-Api-Secret-Token header.');
      throw new ForbiddenException('Missing signature');
    }

    if (secretToken !== expectedToken) {
      this.logger.warn('Invalid Telegram webhook secret token.');
      throw new ForbiddenException('Invalid signature');
    }

    return true;
  }
}
