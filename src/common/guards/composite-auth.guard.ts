import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';

@Injectable()
export class CompositeAuthGuard implements CanActivate {
  private readonly logger = new Logger(CompositeAuthGuard.name);

  constructor(
    private readonly apiKeyGuard: ApiKeyGuard,
    private readonly jwtAuthGuard: JwtAuthGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip || request.connection?.remoteAddress;
    
    // 1. Check API Key first (System M2M calls)
    try {
        if (request.headers['x-api-key']) {
            this.logger.debug(`API Key auth attempt from ${ip}`);
            const result = this.apiKeyGuard.canActivate(context);
            if (result) {
                this.logger.log(`API Key auth SUCCESS from ${ip}`);
                return true;
            }
        }
    } catch (e) {
        this.logger.warn(`API Key auth FAILED from ${ip}: ${e.message}`);
        // Continue to JWT check
    }

    // 2. Check JWT (User Dashboard calls)
    try {
        const authHeader = request.headers['authorization'];
        if (authHeader) {
            this.logger.debug(`JWT auth attempt from ${ip}`);
        }
        const result = this.jwtAuthGuard.canActivate(context);
        if (result) {
            this.logger.log(`JWT auth SUCCESS from ${ip}`);
            return true;
        }
    } catch (e) {
        this.logger.warn(`JWT auth FAILED from ${ip}: ${e.message}`);
    }

    this.logger.warn(`All auth methods FAILED from ${ip}`);
    throw new UnauthorizedException('Missing or Invalid Credentials (API Key or JWT)');
  }
}
