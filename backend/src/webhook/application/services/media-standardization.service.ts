import { Inject, Injectable, Logger } from '@nestjs/common';
import { ILLMProvider, LLM_PROVIDER_TOKEN } from '../../../common/llm/llm-provider.interface';
import { IMessagingService } from '../../../common/messaging/messaging.service.interface';
import { MessageType } from '../../domain/unified-message.interface';

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
    fileId: string, 
    type: MessageType.VOICE | MessageType.AUDIO,
    messagingService: any // Platform-specific messaging service for download
  ): Promise<string | null> {
    try {
      const { buffer } = await messagingService.downloadMedia(fileId);
      
      const base64Audio = buffer.toString('base64');
      const mimeType = type === MessageType.VOICE ? 'audio/ogg' : 'audio/mpeg'; 
      
      const transcription = await this.llmProvider.transcribeAudio(base64Audio, mimeType);
      
      if (!transcription || transcription.toLowerCase().includes('audio unclear')) {
          this.logger.warn(`Audio transcription unclear for file ${fileId}`);
          return null;
      }

      return transcription;
    } catch (e) {
      this.logger.error(`Failed to process audio for file ${fileId}`, e);
      throw e;
    }
  }
}
