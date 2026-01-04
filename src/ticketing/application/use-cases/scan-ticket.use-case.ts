
import { Injectable, Inject, Logger } from '@nestjs/common';
import { ITicketRepository, I_TICKET_REPOSITORY } from '../../domain/ports/ticket.repository.interface';
import { IQRCodeService, I_QRCODE_SERVICE } from '../../domain/ports/qrcode.service.interface';
import { ILLMProvider, LLM_PROVIDER_TOKEN } from '../../../common/llm/llm-provider.interface';
import { TicketStatus } from '../../domain/ticket.entity';

@Injectable()
export class ScanTicketUseCase {
  private readonly logger = new Logger(ScanTicketUseCase.name);

  constructor(
    @Inject(I_TICKET_REPOSITORY) private readonly ticketRepository: ITicketRepository,
    @Inject(I_QRCODE_SERVICE) private readonly qrCodeService: IQRCodeService,
    @Inject(LLM_PROVIDER_TOKEN) private readonly llmProvider: ILLMProvider,
  ) {}

  async execute(mediaBuffer: Buffer, mimeType: string, scannerPhone: string): Promise<string> {
    // 1. Use Vision LLM to read QR Code
    // Note: LLMs might struggle with perfect OCR of long keys. Ideally detailed prompt helps.
    // If this proves unreliable in Prod, swith to 'jsqr'.
    const base64Data = mediaBuffer.toString('base64');
    
    // We expect the LLM to return the JWT string found in the QR.
    // We'll use a direct prompt for this specific task, bypassing the standard 'analyzeMedia' structured intent if needed,
    // or we assume analyzeMedia returns the raw text or a specific "SCANNED_CONTENT" action.
    // For simplicity, let's call analyzeMedia with a specific prompt.
    
    const prompt = `
      Look at this image. It should contain a QR Code.
      READ the content of the QR Code EXACTLY character by character.
      Return ONLY a JSON object: { "qr_content": "THE_STRING_YOU_READ" }.
      Do not add any other text.
    `;
    
    // We use the general provider but overriding prompt behavior via options if supported 
    // or we trust the provider to return 'actions' if we stick to the interface.
    // The current GeminiLLMProvider interface returns LLMAnalysisResult ({ actions }).
    // We should probably adapt the prompt to fit that structure or parse strictly.
    
    // Let's try to fit into the 'actions' schema or just use the extracted string.
    // Actually our Gemini Provider implementation allows passing a 'prompt' option.
    // But it expects to return LLMAnalysisResult.
    // Let's ask it to return action "SCAN_RESULT" with data "content".
    
    const scanPrompt = `
      Analyze this image. Find a QR Code.
      Extract its content EXACTLY.
      Return JSON with actions array.
      Action: { "intent": "SCAN_RESULT", "data": { "content": "THE_EXACT_STRING" } }
    `;

    const result = await this.llmProvider.analyzeMedia(base64Data, mimeType, { prompt: scanPrompt });
    const action = result.actions.find(a => a.intent === 'SCAN_RESULT');

    if (!action || !action.data.content) {
        return "❌ Impossible de lire le QR Code sur cette image. Essayez de vous rapprocher.";
    }

    const token = action.data.content;

    // 2. Verify Signature
    const ticketId = this.qrCodeService.verifySignedPayload(token);
    if (!ticketId) {
        this.logger.warn(`Invalid signature for token: ${token}`);
        return "❌ QR Code Invalide (Signature falsifiée).";
    }

    // 3. Check DB Status
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

    // 4. Validate Entry (Mark as USED)
    ticket.use();
    await this.ticketRepository.save(ticket);

    return `✅ ENTRÉE VALIDÉE\nBillet: ${ticket.id.substring(0, 8)}...\nClient: ${ticket.attendeePhone}`;
  }
}
