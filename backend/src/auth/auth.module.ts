import { Module, forwardRef } from '@nestjs/common';
import { RequestMagicLinkUseCase } from './application/use-cases/request-magic-link.use-case';
import { VerifyMagicLinkUseCase } from './application/use-cases/verify-magic-link.use-case';
import { AuthController } from './infrastructure/web/auth.controller';
import { RedisAuthRepository } from './infrastructure/persistence/redis-auth.repository';
import { WhatsAppMessagingProvider } from './infrastructure/messaging/whatsapp-messaging.provider';
import { JwtTokenService } from './infrastructure/token/jwt-token.service';
import { I_AUTH_REPOSITORY } from './domain/ports/auth.repository.interface';
import { I_MESSAGING_PROVIDER } from './domain/ports/messaging-provider.interface';
import { I_TOKEN_SERVICE } from './domain/ports/token.service.interface';
import { WhatsAppModule } from '../common/whatsapp/whatsapp.module';
import { UserModule } from '../user/user.module';
import { OrganizationModule } from '../organization/organization.module';
import { JwtAuthGuard } from './infrastructure/guards/jwt-auth.guard';
import { CompositeAuthGuard } from '../common/guards/composite-auth.guard';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Module({
  imports: [
    WhatsAppModule, 
    UserModule,
    forwardRef(() => OrganizationModule)
  ],
  controllers: [AuthController],
  providers: [
    RequestMagicLinkUseCase,
    VerifyMagicLinkUseCase,
    RedisAuthRepository,
    WhatsAppMessagingProvider,
    JwtTokenService,
    JwtAuthGuard,
    CompositeAuthGuard,
    ApiKeyGuard,
    RolesGuard,
    {
      provide: I_AUTH_REPOSITORY,
      useClass: RedisAuthRepository,
    },
    {
      provide: I_MESSAGING_PROVIDER,
      useClass: WhatsAppMessagingProvider,
    },
    {
      provide: I_TOKEN_SERVICE,
      useClass: JwtTokenService,
    },
  ],
  exports: [
    I_TOKEN_SERVICE,
    JwtAuthGuard,
    CompositeAuthGuard,
    ApiKeyGuard,
    RolesGuard
  ]
})
export class AuthModule {}
