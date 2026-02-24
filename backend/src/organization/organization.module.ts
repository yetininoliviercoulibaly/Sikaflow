import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { OrganizationSchema } from './infrastructure/persistence/organization.schema';
import { OrganizationMemberSchema } from './infrastructure/persistence/organization-member.schema';
import { MikroOrmOrganizationRepository } from './infrastructure/persistence/mikro-orm-organization.repository';
import { I_ORGANIZATION_REPOSITORY } from './domain/ports/organization.repository.interface';
import { OrganizationController } from './application/controllers/organization.controller';
import { CreateOrganizationUseCase } from './application/use-cases/create-organization.use-case';
import { AddMemberUseCase } from './application/use-cases/add-member.use-case';
import { ResolveContextUseCase } from './application/use-cases/resolve-context.use-case';
import { RemoveMemberUseCase } from './application/use-cases/remove-member.use-case';
import { SwitchOrganizationUseCase } from './application/use-cases/switch-organization.use-case';
import { GetOrganizationsByPhoneUseCase } from './application/use-cases/get-organizations-by-phone.use-case';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';
import { forwardRef } from '@nestjs/common';

@Module({
  imports: [
    MikroOrmModule.forFeature([OrganizationSchema, OrganizationMemberSchema]),
    UserModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [OrganizationController],
  providers: [
    {
      provide: I_ORGANIZATION_REPOSITORY,
      useClass: MikroOrmOrganizationRepository,
    },
    CreateOrganizationUseCase,
    AddMemberUseCase,
    ResolveContextUseCase,
    RemoveMemberUseCase,
    SwitchOrganizationUseCase,
    GetOrganizationsByPhoneUseCase,
  ],
  exports: [I_ORGANIZATION_REPOSITORY, ResolveContextUseCase, RemoveMemberUseCase, SwitchOrganizationUseCase, CreateOrganizationUseCase, AddMemberUseCase],
})
export class OrganizationModule {}
