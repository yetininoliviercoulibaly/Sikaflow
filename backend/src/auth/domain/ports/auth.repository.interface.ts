import { MagicLinkToken } from '../magic-link-token.entity';

export const I_AUTH_REPOSITORY = 'I_AUTH_REPOSITORY';

export interface IAuthRepository {
  save(token: MagicLinkToken): Promise<void>;
  findByToken(token: string): Promise<MagicLinkToken | null>;
  update(token: MagicLinkToken): Promise<void>;
}
