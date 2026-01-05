import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { ITokenService } from '../../domain/ports/token.service.interface';

@Injectable()
export class JwtTokenService implements ITokenService {
  private readonly secret = process.env.JWT_SECRET || 'dev_secret';

  generateJwt(payload: { sub: string; role?: string; phone?: string }): string {
    return jwt.sign(payload, this.secret, { expiresIn: '1d' });
  }

  verifyJwt(token: string): any {
    try {
      return jwt.verify(token, this.secret);
    } catch (error) {
      throw new Error('Invalid Token');
    }
  }
}
