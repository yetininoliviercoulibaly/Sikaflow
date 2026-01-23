import { Injectable } from '@nestjs/common';
import { LLMIntent, LLMAnalysisResult } from '../../../common/llm/llm-types';

@Injectable()
export class IntentResolverService {
  private readonly STOP_KEYWORDS = ['STOP', 'ANNULER', 'CANCEL', 'EXIT', 'NON', 'RIEN'];
  private readonly HELP_KEYWORDS = ['AIDE', 'HELP', 'MENU'];

  /**
   * Resolves the intent based on keywords or special tokens
   */
  resolveHeuristicIntent(content: string): LLMAnalysisResult | null {
    const upperContent = content.trim().toUpperCase();

    // 1. Special CLAIM token regex
    if (upperContent.startsWith('CLAIM-')) {
      return {
        intent: LLMIntent.CLAIM_TICKET,
        data: { token: content.trim() },
        actions: [{ intent: LLMIntent.CLAIM_TICKET, data: { raw_message: content.trim() } }]
      };
    }

    // 2. Cancellation Keywords
    if (this.STOP_KEYWORDS.includes(upperContent)) {
      return { intent: LLMIntent.UNKNOWN, data: {}, actions: [] };
    }

    // 3. Help Keywords
    if (this.HELP_KEYWORDS.includes(upperContent)) {
      return { intent: LLMIntent.HELP, data: {}, actions: [] };
    }

    return null;
  }

  /**
   * Determines if a new intent should override the pending one
   */
  shouldOverridePending(analysis: LLMAnalysisResult, pendingIntent: string): boolean {
    if (!analysis.intent || analysis.intent === LLMIntent.UNKNOWN) return false;
    
    // Override if confidence is high and intent changed
    return analysis.intent !== pendingIntent && (analysis.confidence || 0) >= 0.85;
  }
}
