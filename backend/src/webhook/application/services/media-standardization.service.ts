import { Inject, Injectable, Logger } from '@nestjs/common';
import { ILLMProvider, LLM_PROVIDER_TOKEN } from '../../../common/llm/llm-provider.interface';
import { MessageType } from '../../domain/message.entity';

@Injectable()
export class MediaStandardizationService {
  private readonly logger = new Logger(MediaStandardizationService.name);

  constructor(
    @Inject(LLM_PROVIDER_TOKEN) private readonly llmProvider: ILLMProvider,
  ) {}

  /**
   * Transcribes audio content from a messaging platform
   */
  async transcribeAudio(
    audioBuffer: Buffer, 
    type: MessageType.VOICE | MessageType.AUDIO
  ): Promise<string | null> {
    try {
      if (audioBuffer.length > 20 * 1024 * 1024) { // 20MB limit
         this.logger.warn(`Media file too large (${audioBuffer.length} bytes), skipping.`);
         return null;
      }
      
      const base64Audio = audioBuffer.toString('base64');
      const mimeType = type === MessageType.VOICE ? 'audio/ogg' : 'audio/mpeg'; 
      
      const transcription = await this.llmProvider.transcribeAudio(base64Audio, mimeType);
      
      if (!transcription || transcription.toLowerCase().includes('audio unclear')) {
          this.logger.warn(`Audio transcription unclear`);
          return null;
      }

      return transcription;
    } catch (e) {
      this.logger.error(`Failed to process audio`, e);
      throw e;
    }
  }
}
