import { Test, TestingModule } from '@nestjs/testing';
import { RequestMagicLinkUseCase } from '../auth/application/use-cases/request-magic-link.use-case';
import { VerifyMagicLinkUseCase } from '../auth/application/use-cases/verify-magic-link.use-case';
import { I_AUTH_REPOSITORY } from '../auth/domain/ports/auth.repository.interface';
import { I_MESSAGING_PROVIDER, IMessagingProvider } from '../auth/domain/ports/messaging-provider.interface';
import { I_TOKEN_SERVICE } from '../auth/domain/ports/token.service.interface';
import { MagicLinkToken } from '../auth/domain/magic-link-token.entity';
import { JwtTokenService } from '../auth/infrastructure/token/jwt-token.service';
import { I_USER_REPOSITORY } from '../user/domain/ports/user.repository.interface';
import { I_ORGANIZATION_REPOSITORY } from '../organization/domain/ports/organization.repository.interface';

// Mock Repository (In-Memory)
class InMemoryAuthRepository {
  private tokens: Map<string, MagicLinkToken> = new Map();
  async save(token: MagicLinkToken) { this.tokens.set(token.token, token); }
  async findByToken(token: string) { return this.tokens.get(token) || null; }
  async update(token: MagicLinkToken) { this.tokens.set(token.token, token); }
}

// Mocks for User and Org
class MockUserRepository {
    async findByPhoneNumber(phone: string) { return null; } // Simulate new user
}
class MockOrganizationRepository {
    async findOrganizationsForUser(userId: string) { return []; }
    async findMember(orgId: string, userId: string) { return null; }
}

// Mock Messaging Provider
class MockMessagingProvider implements IMessagingProvider {
  public lastLink: string | null = null;
  async sendMagicLink(phoneNumber: string, link: string, language?: string) {
    console.log(`[MOCK WHATSAPP] Sending to ${phoneNumber}: ${link} (Lang: ${language})`);
    this.lastLink = link;
  }
}

async function run() {
  console.log('🚀 Starting Magic Link E2E Verification...');

  const module: TestingModule = await Test.createTestingModule({
    providers: [
      RequestMagicLinkUseCase,
      VerifyMagicLinkUseCase,
      JwtTokenService,
      { provide: I_AUTH_REPOSITORY, useClass: InMemoryAuthRepository },
      { provide: I_MESSAGING_PROVIDER, useClass: MockMessagingProvider },
      { provide: I_TOKEN_SERVICE, useClass: JwtTokenService },
      { provide: I_USER_REPOSITORY, useClass: MockUserRepository },
      { provide: I_ORGANIZATION_REPOSITORY, useClass: MockOrganizationRepository },
    ],
  }).compile();

  const requestUseCase = module.get(RequestMagicLinkUseCase);
  const verifyUseCase = module.get(VerifyMagicLinkUseCase);
  const messagingProvider = module.get<MockMessagingProvider>(I_MESSAGING_PROVIDER);
  const tokenService = module.get(JwtTokenService);

  const testPhone = '+33612345678';

  // 1. Request Link
  console.log(`\n1. Requesting Magic Link for ${testPhone}...`);
  await requestUseCase.execute(testPhone);

  if (!messagingProvider.lastLink) {
    console.error('❌ Failed: Link was not sent via MessagingProvider');
    process.exit(1);
  }
  console.log('✅ Link requested successfully.');

  // 2. Extract Token
  const token = messagingProvider.lastLink.split('token=')[1];
  console.log(`\n2. Extracted Token: ${token}`);

  // 3. Verify Token
  console.log('\n3. Verifying Token...');
  const jwt = await verifyUseCase.execute(token);
  console.log(`✅ Token verified. JWT: ${jwt}`);

  // 4. Validate JWT
  const decoded = tokenService.verifyJwt(jwt);
  if (decoded.sub === testPhone) {
    console.log(`✅ JWT Validated. Sub: ${decoded.sub}`);
  } else {
    console.error(`❌ JWT Subject Mismatch: ${decoded.sub}`);
    process.exit(1);
  }

  // 5. Replay Attack Test
  console.log('\n4. Testing Replay Attack (Using token again)...');
  try {
    await verifyUseCase.execute(token);
    console.error('❌ Failed: Should have rejected used token');
  } catch (e) {
    console.log('✅ Correctly rejected used token.');
  }

  console.log('\n🎉 Verification SUCCESS!');
}

run();
