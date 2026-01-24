import { Injectable, Logger } from '@nestjs/common';
import { DATE_KEYWORDS, METRIC_KEYWORDS, NAME_PREFIXES, PERIOD_KEYWORDS } from '../../domain/constants/webhook.constants';

@Injectable()
export class MessageExtractionService {
  private readonly logger = new Logger(MessageExtractionService.name);

  // Static compiled regex patterns
  private static readonly DATE_PATTERN = /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})|(\d{1,2}\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre))/i;
  private static readonly AMOUNT_PATTERN = /(\d+([.,]\d+)?)/;
  private static readonly DIGITS_ONLY_PATTERN = /^\d+$/;

  /**
   * Applies heuristics to merge new text into pending action data
   */
  applyHeuristics(
    content: string, 
    pending: { intent: string, missing_fields?: string[], data: Record<string, unknown> }, 
    llmData: Record<string, unknown>
  ): Record<string, unknown> {
      const mergedData = { ...pending.data, ...llmData };
      const missingFields = pending.missing_fields || [];
      const lowerContent = content.toLowerCase();

      // Date heuristic
      let isDate = false;
      if (!mergedData['date'] && missingFields.includes('date')) {
          const dateResult = this.extractDate(content, lowerContent);
          if (dateResult) {
              mergedData['date'] = dateResult;
              isDate = true;
          }
      }

      // Amount heuristic
      let amountExtracted = false;
      if (!mergedData['amount'] && missingFields.includes('amount') && !isDate) {
           const extracted = this.extractAmountFromText(content);
           if (extracted !== null) {
                mergedData['amount'] = extracted;
                amountExtracted = true;
           }
      }
      
      // Period heuristic
      if (!mergedData['period'] && missingFields.includes('period')) {
           const extracted = this.extractPeriodFromText(lowerContent);
           if (extracted) mergedData['period'] = extracted;
      }
      
      // Metric heuristic
      if (!mergedData['metric'] && missingFields.includes('metric')) {
           const extracted = this.extractMetricFromText(lowerContent);
           if (extracted) mergedData['metric'] = extracted;
      }

      // Capacity heuristic
      if (!mergedData['capacity'] && missingFields.includes('capacity') && !isDate) {
          const extracted = this.extractAmountFromText(content);
          if (extracted !== null) {
              mergedData['capacity'] = String(extracted);
              amountExtracted = true; // Re-use amount extraction flag logic
          }
      }

      // Price heuristic
      if (!mergedData['price'] && missingFields.includes('price') && !isDate && !amountExtracted) {
          const extracted = this.extractAmountFromText(content);
          if (extracted !== null) mergedData['price'] = String(extracted);
      }

      // Name heuristics
      this.extractNameHeuristics(content, pending, missingFields, mergedData);

      return mergedData;
  }

  private extractDate(content: string, lowerContent: string): string | null {
      const hasRelativeKeyword = DATE_KEYWORDS.RELATIVE.some(k => lowerContent.includes(k));
      const isShortEnough = content.length > 4 && content.length < 50;

      if (hasRelativeKeyword || MessageExtractionService.DATE_PATTERN.test(content) || isShortEnough) {
           if (!MessageExtractionService.DIGITS_ONLY_PATTERN.test(content)) {
               const cleaned = this.cleanupDate(content);
               const isoDate = this.parseRelativeDateToIso(cleaned);
               return isoDate || cleaned;
           }
      }
      return null;
  }

  private extractNameHeuristics(
      content: string, 
      pending: { intent: string }, 
      missingFields: string[], 
      mergedData: Record<string, unknown>
  ): void {
      const nameField = missingFields.includes('event_name') ? 'event_name' : (missingFields.includes('name') ? 'name' : (missingFields.includes('contact_name') ? 'contact_name' : null));
      
      if (nameField && !mergedData[nameField]) {
          const isNameIntent = [
              'CREATE_ORGANIZATION', 
              'CREATE_EVENT', 
              'GENERATE_CLAIM_LINKS',
              'ADD_DEBT',
              'ADD_CREDIT',
              'SETTLE_DEBT',
              'SEND_REMINDER'
          ].includes(pending.intent);

          if (isNameIntent && content.length > 2 && content.length < 100 && !content.includes('/') && !MessageExtractionService.DIGITS_ONLY_PATTERN.test(content)) {
              mergedData[nameField] = this.cleanupName(content);
          }
      }
  }

  parseRelativeDateToIso(text: string): string | null {
      const lower = text.toLowerCase();
      const now = new Date();
      
      if (lower.includes("aujourd'hui") || lower.includes("ce jour") || lower.includes("ce soir")) {
          return now.toISOString();
      }
      
      if (lower.includes("après-demain")) {
          const target = new Date(now);
          target.setDate(now.getDate() + 2);
          return target.toISOString();
      }

      if (lower.includes("demain")) {
          const target = new Date(now);
          target.setDate(now.getDate() + 1);
          return target.toISOString();
      }

      return null;
  }

  cleanupName(text: string): string {
      let cleaned = text.trim();
      const lowerCleaned = cleaned.toLowerCase();
      
      for (const prefix of NAME_PREFIXES) {
          if (lowerCleaned.startsWith(prefix)) {
              cleaned = cleaned.substring(prefix.length).trim();
              if (cleaned.toLowerCase().startsWith('le ')) cleaned = cleaned.substring(3);
              if (cleaned.toLowerCase().startsWith('la ')) cleaned = cleaned.substring(3);
              if (cleaned.toLowerCase().startsWith('l\'')) cleaned = cleaned.substring(2);
              break; 
          }
      }
      if (cleaned.endsWith('.')) cleaned = cleaned.slice(0, -1);
      return cleaned.trim();
  }

  cleanupDate(text: string): string {
      let cleaned = text.trim();
      const lowerCleaned = cleaned.toLowerCase();
      
      for (const prefix of DATE_KEYWORDS.PREFIXES) {
          if (lowerCleaned.startsWith(prefix)) {
              cleaned = cleaned.substring(prefix.length).trim();
              break;
          }
      }
      if (cleaned.endsWith('.')) cleaned = cleaned.slice(0, -1);
      return cleaned.trim();
  }

  extractAmountFromText(text: string): number | null {
      const match = text.match(MessageExtractionService.AMOUNT_PATTERN);
      return match ? parseFloat(match[0].replace(',', '.')) : null;
  }

  extractPeriodFromText(text: string): string | null {
      for (const [keywords, value] of PERIOD_KEYWORDS) {
          if (keywords.some(k => text.includes(k))) return value;
      }
      return null;
  }

  extractMetricFromText(text: string): string | null {
      for (const [keywords, value] of METRIC_KEYWORDS) {
          if (keywords.some(k => text.includes(k))) return value;
      }
      return null;
  }
}
