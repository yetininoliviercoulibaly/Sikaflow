
export const I_TOKEN_SERVICE = 'I_TOKEN_SERVICE';

export interface ITokenService {
  generateJwt(payload: { sub: string; role?: string; phone?: string }): string;
  verifyJwt(token: string): any;
}
