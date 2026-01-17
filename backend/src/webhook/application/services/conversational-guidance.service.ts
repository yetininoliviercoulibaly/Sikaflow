import { Injectable } from '@nestjs/common';
import { LLMIntent } from '../../../common/llm/llm-types';
import { MessagingPlatforms } from '../../../common/messaging/domain/constants/messaging-platforms.enum';
import { CategoryTranslator } from '../../../common/utils/category-translator';

export interface GuidanceResponse {
  message: string;
  buttons?: { id: string; title: string }[];
}

@Injectable()
export class ConversationalGuidanceService {
  /**
   * Generates a friendly, guided prompt when information is missing for an action.
   */
  getGuidance(intent: string, missingField: string, platform: MessagingPlatforms, currentData: any = {}): GuidanceResponse {
    const isExpense = currentData.type === 'EXPENSE';
    const isIncome = currentData.type === 'INCOME';

    // 1. Transaction Guided Flow
    if (intent === LLMIntent.CREATE_TRANSACTION) {
      if (missingField === 'amount') {
        const actionLabel = isExpense ? 'cette dépense' : isIncome ? 'cette recette' : 'cette transaction';
        return {
          message: `D'accord ! 📝 **Quel est le montant de ${actionLabel} ?** (ex: 50)`,
        };
      }

      if (missingField === 'category') {
        const type = currentData.type || 'EXPENSE';
        const amount = currentData.amount || 0;
        const currency = currentData.currency || 'EUR';
        
        // Encode full context in button IDs for stateless handling
        // Format: SELECT_CAT|Type|Amount|Currency|Category
        const categories = [
          { id: `SELECT_CAT|${type}|${amount}|${currency}|FOOD`, title: '🍔 Alimentation' },
          { id: `SELECT_CAT|${type}|${amount}|${currency}|TRANSPORT`, title: '🚕 Transport' },
          { id: `SELECT_CAT|${type}|${amount}|${currency}|SUPPLIES`, title: '📦 Fournitures' },
          { id: `SELECT_CAT|${type}|${amount}|${currency}|MARKETING`, title: '📢 Marketing' },
          { id: `SELECT_CAT|${type}|${amount}|${currency}|OTHER`, title: '🔄 Autre' },
        ];
        
        // Telegram supports more buttons easily, WhatsApp limited to 3 usually in quick buttons
        return {
          message: `C'est noté. 📂 **Dans quelle catégorie souhaitez-vous classer cela ?**`,
          buttons: platform === MessagingPlatforms.TELEGRAM ? categories : categories.slice(0, 3)
        };
      }
    }

    // 2. Organization Creation
    if (intent === LLMIntent.CREATE_ORGANIZATION && missingField === 'name') {
        return {
            message: `Super ! 🏢 **Comment s'appelle votre organisation ou votre événement ?**`
        };
    }

    // 3. Fallback (Robotic but slightly better)
    return {
      message: `Il manque une information (${missingField}) pour terminer cette action. Pouvez-vous préciser ?`,
    };
  }
}
