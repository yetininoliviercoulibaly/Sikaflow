
import { Injectable, Inject, Logger } from '@nestjs/common';
import { ITicketRepository, I_TICKET_REPOSITORY } from '../../domain/ports/ticket.repository.interface';
import { IQRCodeService, I_QRCODE_SERVICE } from '../../domain/ports/qrcode.service.interface';
import { ILLMProvider, LLM_PROVIDER_TOKEN } from '../../../common/llm/llm-provider.interface';
import { TicketStatus } from '../../domain/ticket.entity';
import jsQR from 'jsqr';
import sharp from 'sharp';

@Injectable()
export class ScanTicketUseCase {
  private readonly logger = new Logger(ScanTicketUseCase.name);

  constructor(
    @Inject(I_TICKET_REPOSITORY) private readonly ticketRepository: ITicketRepository,
    @Inject(I_QRCODE_SERVICE) private readonly qrCodeService: IQRCodeService,
    @Inject(LLM_PROVIDER_TOKEN) private readonly llmProvider: ILLMProvider,
  ) {}

  async execute(mediaBuffer: Buffer, mimeType: string, scannerPhone: string): Promise<string> {
    // 1. Try deterministic jsQR first (fast, reliable)
    let qrContent = await this.tryJsQR(mediaBuffer);
    
    // 2. Fallback to LLM Vision if jsQR fails (handles blurry/angled images)
    if (!qrContent) {
      this.logger.debug('jsQR failed, falling back to LLM Vision');
      qrContent = await this.tryLLMVision(mediaBuffer, mimeType);
    }

    if (!qrContent) {
      return "❌ Impossible de lire le QR Code sur cette image. Essayez de vous rapprocher ou de mieux cadrer.";
    }

    // 3. Verify Signature
    const ticketId = this.qrCodeService.verifySignedPayload(qrContent);
    if (!ticketId) {
      this.logger.warn(`Invalid signature for token: ${qrContent.substring(0, 20)}...`);
      return "❌ QR Code Invalide (Signature falsifiée ou non reconnu).";
    }

    // 4. Check DB Status
    const ticket = await this.ticketRepository.findById(ticketId);
    if (!ticket) {
      return "❌ Billet inconnu au système.";
    }

    if (ticket.status === TicketStatus.USED) {
      return `❌ REFUSÉ : Billet DÉJÀ UTILISÉ.\n(Scanné précédemment le ${ticket.usedAt?.toLocaleTimeString()})`;
    }

    if (ticket.status !== TicketStatus.VALID) {
      return `❌ REFUSÉ : Billet ${ticket.status}.`;
    }

    // 5. Validate Entry (Mark as USED)
    ticket.use();
    await this.ticketRepository.save(ticket);

    const attendeeInfo = ticket.attendeePhone ? `Client: ${ticket.attendeePhone}` : 'Billet anonyme';
    return `✅ ENTRÉE VALIDÉE\nBillet: ${ticket.id.substring(0, 8)}...\n${attendeeInfo}`;
  }

  /**
   * Decode QR using jsQR library with sharp for image processing
   */
  private async tryJsQR(mediaBuffer: Buffer): Promise<string | null> {
    try {
      // Use sharp to decode image to raw RGBA data
      const { data, info } = await sharp(mediaBuffer)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      
      // jsQR expects Uint8ClampedArray RGBA data
      const clampedData = new Uint8ClampedArray(data);
      const result = jsQR(clampedData, info.width, info.height);
      
      if (result && result.data) {
        this.logger.debug(`jsQR decoded successfully: ${result.data.substring(0, 20)}...`);
        return result.data;
      }
      
      return null;
    } catch (error) {
      this.logger.warn(`jsQR processing error: ${error.message}`);
      return null;
    }
  }

  /**
   * Fallback: Use LLM Vision to read QR (handles difficult images)
   */
  private async tryLLMVision(mediaBuffer: Buffer, mimeType: string): Promise<string | null> {
    try {
      const base64Data = mediaBuffer.toString('base64');
      
      const scanPrompt = `
        Analyze this image. Find a QR Code.
        Extract its content EXACTLY character by character.
        Return JSON with actions array.
        Action: { "intent": "SCAN_RESULT", "data": { "content": "THE_EXACT_STRING" } }
      `;

      const result = await this.llmProvider.analyzeMedia(base64Data, mimeType, { prompt: scanPrompt });
      const action = result.actions.find(a => a.intent === 'SCAN_RESULT');

      if (action && action.data.content) {
        this.logger.debug(`LLM Vision decoded: ${action.data.content.substring(0, 20)}...`);
        return action.data.content;
      }
      
      return null;
    } catch (error) {
      this.logger.error(`LLM Vision error: ${error.message}`);
      return null;
    }
  }
}

