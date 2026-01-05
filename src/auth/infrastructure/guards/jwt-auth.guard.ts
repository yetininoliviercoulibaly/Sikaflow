import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Inject } from '@nestjs/common';
import { ITokenService, I_TOKEN_SERVICE } from '../../domain/ports/token.service.interface';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(I_TOKEN_SERVICE)
    private readonly tokenService: ITokenService
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader) return false;

    const [bearer, token] = authHeader.split(' ');
    if (bearer !== 'Bearer' || !token) return false;

    try {
      const decoded = this.tokenService.verifyJwt(token);
      request.user = decoded; // Attach user to request
      return true;
    } catch (err) {
      return false;
    }
  }
}
