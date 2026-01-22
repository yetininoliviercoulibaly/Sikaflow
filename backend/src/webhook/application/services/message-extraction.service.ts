import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MessageExtractionService {
  private readonly logger = new Logger(MessageExtractionService.name);

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

      // Date heuristic: Check this FIRST to avoid matching date parts as amounts
      let isDate = false;
      if (!mergedData['date'] && missingFields.includes('date')) {
          const datePattern = /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})|(\d{1,2}\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre))/i;
          const relativeKeywords = ["aujourd'hui", "demain", "après-demain", "ce soir"];
          const hasRelativeKeyword = relativeKeywords.some(k => content.toLowerCase().includes(k));

          if (hasRelativeKeyword || datePattern.test(content) || (content.length > 4 && content.length < 50)) {
               if (!/^\d+$/.test(content)) {
                   const cleaned = this.cleanupDate(content);
                   const isoDate = this.parseRelativeDateToIso(cleaned);
                   mergedData['date'] = isoDate || cleaned;
                   isDate = true;
               }
          }
      }

      if (!mergedData['amount'] && missingFields.includes('amount') && !isDate) {
           const extracted = this.extractAmountFromText(content);
           if (extracted !== null) mergedData['amount'] = extracted;
      }
      
      if (!mergedData['period'] && missingFields.includes('period')) {
           const extracted = this.extractPeriodFromText(lowerContent);
           if (extracted) mergedData['period'] = extracted;
      }
      
      if (!mergedData['metric'] && missingFields.includes('metric')) {
           const extracted = this.extractMetricFromText(lowerContent);
           if (extracted) mergedData['metric'] = extracted;
      }

      let amountExtracted = false;
      if (!mergedData['capacity'] && missingFields.includes('capacity') && !isDate) {
          const extracted = this.extractAmountFromText(content);
          if (extracted !== null) {
              mergedData['capacity'] = String(extracted);
              amountExtracted = true;
          }
      }

      if (!mergedData['price'] && missingFields.includes('price') && !isDate && !amountExtracted) {
          const extracted = this.extractAmountFromText(content);
          if (extracted !== null) mergedData['price'] = String(extracted);
      }

      // Name heuristics
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

          if (isNameIntent && content.length > 2 && content.length < 100 && !content.includes('/') && !/^\d+$/.test(content)) {
              mergedData[nameField] = this.cleanupName(content);
          }
      }

      return mergedData;
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
      const prefixes = [
          "le nom est ",
          "le nom de l'organisation est ",
          "le nom de l'événement est ",
          "l'événement s'appelle ",
          "l'organisation s'appelle ",
          "c'est ",
          "il s'appelle ",
          "c'est l'",
          "le nom c'est "
      ];
      let cleaned = text.trim();
      const lowerCleaned = cleaned.toLowerCase();
      
      for (const prefix of prefixes) {
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
      const prefixes = ["le ", "la date est ", "c'est le ", "pour le "];
      for (const prefix of prefixes) {
          if (lowerCleaned.startsWith(prefix)) {
              cleaned = cleaned.substring(prefix.length).trim();
              break;
          }
      }
      if (cleaned.endsWith('.')) cleaned = cleaned.slice(0, -1);
      return cleaned.trim();
  }

  extractAmountFromText(text: string): number | null {
      const match = text.match(/(\d+([.,]\d+)?)/);
      return match ? parseFloat(match[0].replace(',', '.')) : null;
  }

  extractPeriodFromText(text: string): string | null {
      const periodMap: [string[], string][] = [
          [["aujourd'hui", "ce jour"], 'today'],
          [["hier"], 'yesterday'],
          [["cette semaine"], 'this_week'],
          [["mois dernier"], 'last_month'],
          [["ce mois"], 'this_month'],
          [["cette année"], 'this_year'],
          [["ce semestre"], 'this_semester'],
          [["semestre dernier"], 'last_semester'],
          [["ce trimestre"], 'this_quarter'],
          [["trimestre dernier"], 'last_quarter'],
      ];
      for (const [keywords, value] of periodMap) {
          if (keywords.some(k => text.includes(k))) return value;
      }
      return null;
  }

  extractMetricFromText(text: string): string | null {
      const metricMap: [string[], string][] = [
          [["bénéfice", "profit", "bénéfices"], 'NET_PROFIT'],
          [["chiffre d'affaire", "revenus", "recettes", "ventes"], 'REVENUE'],
          [["dépenses", "charges", "frais", "coûts"], 'EXPENSES'],
          [["pourboire", "tips"], 'TIPS'],
          [["trésorerie", "cash flow", "flux de trésorerie"], 'CASH_FLOW'],
      ];
      for (const [keywords, value] of metricMap) {
          if (keywords.some(k => text.includes(k))) return value;
      }
      return null;
  }
}
