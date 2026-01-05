import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { UserSchema } from './infrastructure/persistence/user.schema';
import { MikroOrmUserRepository } from './infrastructure/persistence/mikro-orm-user.repository';
import { I_USER_REPOSITORY } from './domain/ports/user.repository.interface';

@Module({
  imports: [
    MikroOrmModule.forFeature([UserSchema]),
  ],
  providers: [
    {
      provide: I_USER_REPOSITORY,
      useClass: MikroOrmUserRepository,
    },
  ],
  exports: [I_USER_REPOSITORY],
})
export class UserModule {}
