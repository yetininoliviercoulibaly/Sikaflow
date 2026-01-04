import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class WhatsAppSignatureGuard implements CanActivate {
  private readonly logger = new Logger(WhatsAppSignatureGuard.name);

  canActivate(context: ExecutionContext): boolean {
    // 1. Check if verification is enabled
    // Only verify if explicitly enabled or not defined (default secure)
    // Actually, per plan, default is secure. Allow bypass with 'false'.
    const shouldVerify = process.env.WHATSAPP_VERIFY_SIGNATURE !== 'false';

    if (!shouldVerify) {
      this.logger.warn('WhatsApp Signature Verification BYPASSED via env var.');
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const headers = request.headers;
    const signature = headers['x-hub-signature-256'];
    const appSecret = process.env.WHATSAPP_APP_SECRET;

    if (!appSecret) {
      this.logger.error('WHATSAPP_APP_SECRET is not defined in environment variables.');
      throw new ForbiddenException('Server configuration error');
    }

    if (!signature) {
      this.logger.warn('Missing X-Hub-Signature-256 header.');
      throw new ForbiddenException('Missing signature');
    }

    // 2. Get Raw Body (Must be preserved by middleware)
    const rawBody = request['rawBody'];
    if (!rawBody) {
        this.logger.error('Raw Body not available on request. Middleware misconfiguration?');
        // Fallback or fail? Fail safe.
        throw new ForbiddenException('Internal server error during verification');
    }

    // 3. Verify
    const expectedSignature = 'sha256=' + crypto
      .createHmac('sha256', appSecret)
      .update(rawBody)
      .digest('hex');

    if (signature !== expectedSignature) {
        this.logger.warn('Invalid WhatsApp Signature.');
        throw new ForbiddenException('Invalid signature');
    }

    return true;
  }
}
