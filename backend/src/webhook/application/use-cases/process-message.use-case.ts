import { Inject, Injectable, Logger } from '@nestjs/common';
import { WhatsAppPayloadDto } from '../dtos/whatsapp-payload.dto';
import { IMessageStrategy, MESSAGE_STRATEGY_TOKEN, LLMAnalysisResult } from '../strategies/message-strategy.interface';
import { IUserRepository, I_USER_REPOSITORY } from '../../../user/domain/ports/user.repository.interface';
import { WhatsAppMessagingAdapter } from '../../../common/messaging/whatsapp-messaging.adapter';
import { ActionExecutionService } from '../services/action-execution.service';
import { ConversationStateService } from '../services/conversation-state.service';
import { LLMIntent } from '../../../common/llm/llm-types';
import { MessagingPlatforms } from '../../../common/messaging/domain/constants/messaging-platforms.enum';

@Injectable()
export class ProcessMessageUseCase {
  private readonly logger = new Logger(ProcessMessageUseCase.name);

  constructor(
    @Inject(MESSAGE_STRATEGY_TOKEN)
    private readonly strategies: IMessageStrategy[],
    private readonly whatsAppMessagingAdapter: WhatsAppMessagingAdapter,
    @Inject(I_USER_REPOSITORY) private readonly userRepository: IUserRepository,
    private readonly actionExecutionService: ActionExecutionService,
    private readonly conversationState: ConversationStateService,
  ) {}

  async execute(payload: WhatsAppPayloadDto): Promise<void> {
    const entry = payload.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;
    const statuses = value?.statuses;
    
    if (statuses && statuses.length > 0) {
        this.logger.log(`Received status update from Meta: ${JSON.stringify(statuses)}`);
        return;
    }

    if (!messages || messages.length === 0) {
      this.logger.debug('No messages or statuses found in payload');
      return;
    }

    for (const message of messages) {
      const from = message.from; 
      const messageId = message.id;

      try {
        // 1. Find Strategy
        const strategy = this.strategies.find(s => s.canHandle(message));
        if (!strategy) {
             this.logger.warn(`No strategy found for message type: ${message.type}`);
             continue;
        }

        // Check for specific Regex patterns (Bypass LLM for Claim Links)
        let analysis: any = null;
        if (message.type === 'text' && message.text?.body?.startsWith('CLAIM-')) {
             analysis = {
                 intent: LLMIntent.CLAIM_TICKET,
                 data: { token: message.text.body },
                 actions: [{ intent: LLMIntent.CLAIM_TICKET, data: { raw_message: message.text.body } }]
             };
        } else {
             // 2. Get Pending Context
             const pending = this.conversationState.getPendingAction(from);

             // 3. Process via Strategy (LLM) with Context
             analysis = await strategy.process(message, from, pending ? {
                 pendingAction: {
                     intent: pending.intent,
                     missing_fields: pending.missing_fields
                 }
             } : undefined);
             
             // 4. Resolve Analysis (Context Merging & Loop Breaking)
             if (analysis) {
                 analysis = await this.resolveAnalysis(analysis, message, from, pending);
             }
        }
        
        if (!analysis || (analysis.intent === LLMIntent.UNKNOWN && !analysis.data)) {
             // If unknown and no data, we might have cancelled. Stop.
             if (analysis?.intent === LLMIntent.UNKNOWN) {
                 this.logger.log(`Analysis resulted in UNKNOWN/Cancellation for ${from}`);
             } else {
                 this.logger.warn(`Analysis failed or was skipped via strategy for message ${messageId}`);
             }
             continue;
        }
        
        this.logger.log(`Analysis for ${from}: ${JSON.stringify(analysis)}`);

        // 5. Normalize Actions
        const actions = analysis.actions || (analysis.intent ? [{ intent: analysis.intent, data: analysis.data }] : []);

        // 6. Fetch User
        const user = await this.userRepository.findByPhoneNumber(from);

        // 7. Execute Actions via Service
        await this.actionExecutionService.execute({
            actions,
            messagingService: this.whatsAppMessagingAdapter,
            user,
            senderPhoneNumber: from,
            messageId,
            messageBody: message.type === 'text' && message.text ? message.text.body : undefined,
            platform: MessagingPlatforms.WHATSAPP
        });

      } catch (error) {
        this.logger.error(`Error processing message ${messageId} from ${from}`, error);
      }
    }
  }

  private async resolveAnalysis(
      analysis: LLMAnalysisResult, 
      message: any, 
      from: string, 
      pending: any
  ): Promise<LLMAnalysisResult> {
      if (!pending) return analysis;
      
      const content = message.type === 'text' ? (message.text?.body || '') : '';
      const upperContent = content.toUpperCase();

      // 1. Enhanced Cancellation
      const stopKeywords = ['STOP', 'ANNULER', 'CANCEL', 'EXIT', 'NON', 'RIEN', 'ABANDONNER', 'QUITTER'];
      if (stopKeywords.includes(upperContent)) {
        this.logger.log(`User explicitly cancelled action ${pending.intent}`);
        this.conversationState.clearPendingAction(from);
        return { intent: LLMIntent.UNKNOWN, data: {} };
      }

      // 2. Help/Menu Priority
      const helpKeywords = ['AIDE', 'HELP', 'MENU', 'ACCUEIL', 'DEMARRER', 'START'];
      if (helpKeywords.includes(upperContent) || (analysis.intent === LLMIntent.HELP && (analysis.confidence || 0) > 0.8)) {
         this.logger.log(`User requested HELP/MENU, clearing pending action ${pending.intent}`);
         this.conversationState.clearPendingAction(from);
         return { intent: LLMIntent.HELP, data: {} };
      }

      // 3. Smart Loop Break (High Confidence Intent Change)
      const highConfidenceThreshold = 0.85;
      if (analysis.intent && analysis.intent !== LLMIntent.UNKNOWN && analysis.intent !== pending.intent) {
          if ((analysis.confidence || 0) >= highConfidenceThreshold) {
              this.logger.log(`Breaking loop: New high confidence intent ${analysis.intent} (${analysis.confidence}) overrides pending ${pending.intent}`);
              this.conversationState.clearPendingAction(from);
              return analysis;
          }
      }

      this.logger.log(`Merging pending context for ${from}: ${JSON.stringify(pending)}`);
      
      // 4. Merge Data with Heuristics
      const mergedData = this.applyHeuristics(content, pending, analysis.data || {});
      const remainingMissing = (pending.missing_fields || []).filter((field: string) => {
        const val = mergedData[field];
        return val === undefined || val === null || val === '';
      });
      
      const newAnalysis = {
        intent: pending.intent,
        data: mergedData,
        actions: [{ intent: pending.intent, data: mergedData, missing_fields: remainingMissing }]
      };
      
      if (remainingMissing.length > 0) {
        this.conversationState.setPendingAction(from, {
          intent: pending.intent, data: mergedData, missing_fields: remainingMissing, createdAt: new Date()
        });
      } else {
        this.conversationState.clearPendingAction(from);
      }
      return newAnalysis;
  }

  private applyHeuristics(
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
          const datePattern = /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})|(\d{1,2}\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre))/i;
          const relativeKeywords = ["aujourd'hui", "demain", "après-demain", "ce soir"];
          const hasRelativeKeyword = relativeKeywords.some(k => content.toLowerCase().includes(k));

          if (hasRelativeKeyword || datePattern.test(content) || (content.length > 4 && content.length < 50)) {
               if (!/^\d+$/.test(content)) { // Not pure number
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

      // Name heuristic
      const nameField = missingFields.includes('event_name') ? 'event_name' : (missingFields.includes('name') ? 'name' : (missingFields.includes('contact_name') ? 'contact_name' : null));
      if (nameField && !mergedData[nameField]) {
          const isNameIntent = [
              LLMIntent.CREATE_ORGANIZATION, 
              LLMIntent.CREATE_EVENT, 
              LLMIntent.GENERATE_CLAIM_LINKS,
              LLMIntent.ADD_DEBT,
              LLMIntent.ADD_CREDIT,
              LLMIntent.SETTLE_DEBT,
              LLMIntent.SEND_REMINDER
          ].includes(pending.intent as any);

          if (isNameIntent && content.length > 2 && content.length < 100 && !content.includes('/') && !/^\d+$/.test(content)) {
              mergedData[nameField] = this.cleanupName(content);
          }
      }

      return mergedData;
  }

  private parseRelativeDateToIso(text: string): string | null {
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

  private cleanupName(text: string): string {
      const prefixes = [
          "le nom est ", "le nom de l'organisation est ", "le nom de l'événement est ",
          "l'événement s'appelle ", "l'organisation s'appelle ", "c'est ",
          "il s'appelle ", "c'est l'", "le nom c'est "
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

  private cleanupDate(text: string): string {
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

  private extractAmountFromText(text: string): number | null {
      const match = text.match(/(\d+([.,]\d+)?)/);
      return match ? parseFloat(match[0].replace(',', '.')) : null;
  }

  private extractPeriodFromText(text: string): string | null {
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

  private extractMetricFromText(text: string): string | null {
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
