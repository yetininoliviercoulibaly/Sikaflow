import { Inject, Injectable, Logger } from '@nestjs/common';
import { ILLMProvider, LLM_PROVIDER_TOKEN } from '../../../common/llm/llm-provider.interface';
import { IMessagingService } from '../../../common/messaging/messaging.service.interface';
import { MessageEntity, MessageType } from '../../domain/message.entity';

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
      // PROPOSED: Check file size or use streams if supported by adapter
      // For now, we enforce a safety limit before downloading the full buffer
      const media = await messagingService.downloadMedia(fileId);
      const buffer = media.buffer;

      if (buffer.length > 20 * 1024 * 1024) { // 20MB limit
         this.logger.warn(`Media file ${fileId} too large (${buffer.length} bytes), skipping.`);
         return null;
      }
      
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
