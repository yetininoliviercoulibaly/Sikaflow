import { Injectable, Inject, Logger } from '@nestjs/common';
import { BaseMessageStrategy } from './base-message.strategy';
import { WhatsAppMessageDto } from '../dtos/whatsapp-payload.dto';
import { LLMAnalysisResult } from './message-strategy.interface';
import { IPromptRepository, I_PROMPT_REPOSITORY } from '../../../common/prompt/domain/ports/prompt.repository.interface';
import { WhatsAppService } from '../../../common/whatsapp/whatsapp.service';
import { ILLMProvider, LLM_PROVIDER_TOKEN } from '../../../common/llm/llm-provider.interface';

@Injectable()
export class AudioMessageStrategy extends BaseMessageStrategy {
  constructor(
      @Inject(LLM_PROVIDER_TOKEN) protected readonly llmProvider: ILLMProvider,
      @Inject(I_PROMPT_REPOSITORY) protected readonly promptRepository: IPromptRepository,
      private readonly whatsAppService: WhatsAppService
  ) {
      super(llmProvider, promptRepository);
  }

  canHandle(message: WhatsAppMessageDto): boolean {
    return message.type === 'audio' && !!message.audio;
  }

  async process(message: WhatsAppMessageDto, senderPhoneNumber: string): Promise<LLMAnalysisResult | null> {
    if (!message.audio) return null;

    try {
        // 1. Download Audio
        const media = await this.whatsAppService.downloadMedia(message.audio.id);
        const base64 = media.buffer.toString('base64');
        
        // 2. Transcribe
        const transcribedText = await this.llmProvider.transcribeAudio(base64, media.mimeType);
        
        if (!transcribedText || transcribedText === 'Audio unclear') return null;

        // 3. Analyze Text
        // analyzeText is protected in BaseMessageStrategy. It uses promptRepository.
        // So I DO need promptRepository.
        return this.analyzeText(transcribedText, senderPhoneNumber);

    } catch (error) {
        return null; 
    }
  }
}
