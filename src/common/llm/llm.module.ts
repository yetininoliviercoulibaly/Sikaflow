
import { Module } from '@nestjs/common';
import { LLM_PROVIDER_TOKEN } from './llm-provider.interface';
import { GeminiLLMProvider } from './gemini-llm.provider';
import { PromptModule } from '../prompt/prompt.module';

@Module({
  imports: [PromptModule],
  providers: [
    {
      provide: LLM_PROVIDER_TOKEN,
      useClass: GeminiLLMProvider,
    },
  ],
  exports: [LLM_PROVIDER_TOKEN],
})
export class LlmModule {}
