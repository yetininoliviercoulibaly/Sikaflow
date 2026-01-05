import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PromptTemplateSchema } from './infrastructure/persistence/prompt-template.schema';
import { MikroOrmPromptRepository } from './infrastructure/persistence/mikro-orm-prompt.repository';
import { I_PROMPT_REPOSITORY } from './domain/ports/prompt.repository.interface';

@Module({
  imports: [
    MikroOrmModule.forFeature([PromptTemplateSchema]),
  ],
  providers: [
    {
      provide: I_PROMPT_REPOSITORY,
      useClass: MikroOrmPromptRepository,
    },
  ],
  exports: [I_PROMPT_REPOSITORY],
})
export class PromptModule {}
