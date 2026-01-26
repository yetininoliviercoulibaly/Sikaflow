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
  getGuidance(intent: string, missingFields: string[], platform: MessagingPlatforms, currentData: any = {}): GuidanceResponse {
    const isExpense = currentData.type === 'EXPENSE';
    const isIncome = currentData.type === 'INCOME';
    // Helper to check if a specific field is missing
    const isMissing = (field: string) => missingFields.includes(field);

    // Helper to translate field names for fallback
    const translateField = (field: string) => {
        const map: Record<string, string> = {
            'amount': 'montant',
            'category': 'catégorie',
            'description': 'description',
            'name': 'nom',
            'date': 'date',
            'location': 'lieu',
            'provider': 'moyen de paiement',
            'duration': 'durée',
            'contactName': 'contact',
            'contact_name': 'contact',
            'debtor': 'débiteur'
        };
        return map[field] || field;
    };

    // 1. Transaction Guided Flow
    if (intent === LLMIntent.CREATE_TRANSACTION) {

      // OPTIMIZATION: If both Amount and Category are missing, ask for both together
      if (isMissing('amount') && isMissing('category')) {
          const actionLabel = isExpense ? 'cette dépense' : isIncome ? 'cette recette' : 'cette transaction';
          return {
              message: `D'accord ! 📝 **Quel est le montant et la catégorie de ${actionLabel} ?** (ex: "50€ pour le taxi")`
          };
      }

      if (isMissing('amount')) {
        const actionLabel = isExpense ? 'cette dépense' : isIncome ? 'cette recette' : 'cette transaction';
        return {
          message: `D'accord ! 📝 **Quel est le montant de ${actionLabel} ?** (ex: 50)`,
        };
      }

      if (isMissing('category')) {
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
    if (intent === LLMIntent.CREATE_ORGANIZATION && isMissing('name')) {
        return {
            message: `Super ! 🏢 **Comment s'appelle votre organisation ou votre événement ?**`
        };
    }

    // 3. Subscription Flow
    if (intent === LLMIntent.SUBSCRIBE) {
      if (isMissing('provider')) {
        return {
          message: `💳 **Quel moyen de paiement préférez-vous ?**`,
          buttons: [
             { id: 'SELECT_PROVIDER|STRIPE', title: 'Stripe (CB)' },
             { id: 'SELECT_PROVIDER|WAVE', title: 'Wave' }
          ]
        };
      }
      if (isMissing('duration')) {
        return {
          message: `⏱️ **Quelle durée d'abonnement souhaitez-vous ?**`,
          buttons: [
            { id: 'SELECT_DURATION|1', title: '1 Mois' },
            { id: 'SELECT_DURATION|12', title: '1 An (-20%)' }
          ]
        };
      }
    }

    // 4. Debt Management
    if (intent === LLMIntent.ADD_DEBT || intent === LLMIntent.ADD_CREDIT) {
        if (isMissing('amount') && (isMissing('contactName') || isMissing('contact_name'))) {
            return {
                message: `D'accord. 📒 **Pour qui et quel est le montant ?** (ex: "Jean me doit 5000")`
            };
        }
    }

    // 5. Event Creation
    if (intent === LLMIntent.CREATE_EVENT) {
         if (isMissing('name') && isMissing('date')) {
              return { message: `C'est parti ! 🎉 **Quel est le nom de l'événement et sa date ?**` };
         }
    }

    // Fallback (Improved)
    const missingNames = missingFields.map(translateField).join(' et ');
    return {
      message: `Il me manque des informations pour continuer : **${missingNames}**. Pouvez-vous préciser ?`,
    };
  }
}
