import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Inject } from '@nestjs/common';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { Reflector } from '@nestjs/core';

@Injectable()
export class CompositeAuthGuard implements CanActivate {
  constructor(
    private readonly apiKeyGuard: ApiKeyGuard,
    private readonly jwtAuthGuard: JwtAuthGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // 1. Check API Key first (System M2M calls)
    try {
        if (request.headers['x-api-key']) {
            const result = this.apiKeyGuard.canActivate(context);
            if (result) return true;
        }
    } catch (e) {
        // Continue to JWT check
    }

    // 2. Check JWT (User Dashboard calls)
    try {
        const result = this.jwtAuthGuard.canActivate(context);
        if (result) return true;
    } catch (e) {
        // Both failed
    }

    throw new UnauthorizedException('Missing or Invalid Credentials (API Key or JWT)');
  }
}
