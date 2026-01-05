import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { IAuthRepository, I_AUTH_REPOSITORY } from '../../domain/ports/auth.repository.interface';
import { ITokenService, I_TOKEN_SERVICE } from '../../domain/ports/token.service.interface';
import { IUserRepository, I_USER_REPOSITORY } from '../../../user/domain/ports/user.repository.interface';
import { IOrganizationRepository, I_ORGANIZATION_REPOSITORY } from '../../../organization/domain/ports/organization.repository.interface';
import { UserRole } from '../../../organization/domain/organization-member.entity';

@Injectable()
export class VerifyMagicLinkUseCase {
  constructor(
    @Inject(I_AUTH_REPOSITORY)
    private readonly authRepository: IAuthRepository,
    @Inject(I_TOKEN_SERVICE)
    private readonly tokenService: ITokenService,
    @Inject(I_USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(I_ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: IOrganizationRepository,
  ) {}

  async execute(token: string): Promise<string> {
    // 1. Find Token
    const magicLinkToken = await this.authRepository.findByToken(token);
    if (!magicLinkToken) throw new UnauthorizedException('Invalid token');

    // 2. Validate
    if (!magicLinkToken.isValid()) throw new UnauthorizedException('Token expired or already used');

    // 3. Mark as Used
    magicLinkToken.markAsUsed();
    await this.authRepository.update(magicLinkToken);

    // 4. Resolve User & Role
    const user = await this.userRepository.findByPhoneNumber(magicLinkToken.emailOrPhone);
    let role = 'GUEST';
    let userId = magicLinkToken.emailOrPhone; // Default to phone if no user

    if (user) {
        userId = user.id;
        
        // Admin Check (Env VAR for MVP security)
        const adminPhones = (process.env.ADMIN_PHONE_NUMBERS || '').split(',');
        if (adminPhones.includes(user.phoneNumber)) {
            role = UserRole.ADMIN;
        } else {
            // Find Organizations and determine role
            const orgs = await this.organizationRepository.findOrganizationsForUser(user.id);
            if (orgs.length > 0) {
                // Fetch member details for the first org (Context Switching can happen later in Dashboard)
                // For MVP auth, we look for the highest role or just the role in the last active org.
                // Simpler: Check role in first org found.
                const member = await this.organizationRepository.findMember(orgs[0].id, user.id);
                if (member) role = member.role;
            }
        }
    }

    // 5. Generate JWT
    return this.tokenService.generateJwt({ 
        sub: userId, 
        role: role,
        phone: magicLinkToken.emailOrPhone 
    });
  }
}
