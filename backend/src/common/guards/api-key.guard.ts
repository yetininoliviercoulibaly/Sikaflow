import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];
    const validApiKey = process.env.ADMIN_API_KEY;

    if (!validApiKey) {
        // Fail open or closed? Closed. If no key configured, no access.
        this.logger.error('ADMIN_API_KEY is not defined in environment variables.');
        throw new ForbiddenException('Server configuration error');
    }

    if (apiKey !== validApiKey) {
      this.logger.warn(`Invalid API Key attempt from ${request.ip}`);
      throw new ForbiddenException('Invalid API Key');
    }

    request.user = {
        id: 'system',
        role: 'ADMIN', // UserRole.ADMIN
        phoneNumber: 'SYSTEM'
    };
    return true;
  }
}
