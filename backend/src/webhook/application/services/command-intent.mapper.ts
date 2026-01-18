import { Injectable } from '@nestjs/common';
import { LLMIntent } from '../../../common/llm/llm-types';

export interface MappedAction {
  intent: string;
  data: Record<string, any>;
  missing_fields?: string[];
}

@Injectable()
export class CommandIntentMapper {
  /**
   * Maps a raw interaction ID (from buttons or lists) to a formal LLM-style action
   */
  map(id: string): MappedAction | null {
    // 1. Precise Mappings (Standard Commands)
    const exactMappings: Record<string, MappedAction> = {
      'CMD_TX_EXPENSE': { intent: LLMIntent.CREATE_TRANSACTION, data: { type: 'EXPENSE' }, missing_fields: ['amount', 'category'] },
      'CMD_TX_INCOME': { intent: LLMIntent.CREATE_TRANSACTION, data: { type: 'INCOME' }, missing_fields: ['amount', 'category'] },
      'CMD_INCIDENT': { intent: LLMIntent.REPORT_INCIDENT, data: {}, missing_fields: ['description'] },
      'CMD_REPORT_FLASH': { intent: LLMIntent.GENERATE_REPORT, data: { type: 'FLASH' } },
      'REPORT_FLASH_CMD': { intent: LLMIntent.GENERATE_REPORT, data: { type: 'FLASH' } },
      'CMD_REPORT_WEEK': { intent: LLMIntent.GENERATE_REPORT, data: { type: 'WEEKLY' } },
      'CMD_ADD_MEMBER': { intent: LLMIntent.ADD_MEMBER, data: {}, missing_fields: ['phone'] },
      'CMD_SCAN': { intent: LLMIntent.SCAN_TICKET, data: {} },
      'CMD_STOCK': { intent: LLMIntent.CHECK_STOCK, data: {} },
      'CMD_CREATE_EVENT': { intent: LLMIntent.CREATE_EVENT, data: {}, missing_fields: ['event_name', 'date', 'capacity', 'price'] },
      'HELP_CMD': { intent: LLMIntent.HELP, data: {} },
      'HELP': { intent: LLMIntent.HELP, data: {} },
      'CMD_SUBSCRIBE': { intent: LLMIntent.SUBSCRIBE, data: {} },

      'CREATE_ORG_CMD': { intent: LLMIntent.CREATE_ORGANIZATION, data: {}, missing_fields: ['name'] },
      'ONBOARDING_NEXT': { intent: LLMIntent.ONBOARDING_NEXT, data: {} },
      'REJECT_TX': { intent: LLMIntent.CANCEL_LAST_ACTION, data: {} },
    };

    if (exactMappings[id]) {
      return exactMappings[id];
    }

    // 2. Prefix Mappings (Dynamic Data)
    if (id.startsWith('SWITCH_ORG_ID_')) {
      return {
        intent: LLMIntent.SWITCH_ORGANIZATION,
        data: { targetOrganizationId: id.replace('SWITCH_ORG_ID_', '') }
      };
    }

    if (id.startsWith('CONFIRM_TX|')) {
      const parts = id.split('|');
      // CONFIRM_TX|Amount|Currency|Type|Category
      if (parts.length >= 5) {
        return {
          intent: LLMIntent.CREATE_TRANSACTION,
          data: {
            amount: parseFloat(parts[1]),
            currency: parts[2],
            type: parts[3],
            category: parts[4],
            confidence: 1.0
          }
        };
      }
    }

    if (id.startsWith('FEEDBACK|')) {
      const parts = id.split('|');
      const rating = parseInt(parts[1], 10);
      if (!isNaN(rating)) {
        return {
          intent: 'PROVIDE_FEEDBACK',
          data: { rating, confidence: 1.0 }
        };
      }
    }

    // SELECT_CAT|Type|Amount|Currency|Category - Category selection with full context
    if (id.startsWith('SELECT_CAT|')) {
      const parts = id.split('|');
      // Format: SELECT_CAT|Type|Amount|Currency|Category
      if (parts.length >= 5) {
        return {
          intent: LLMIntent.CREATE_TRANSACTION,
          data: {
            type: parts[1],
            amount: parseFloat(parts[2]),
            currency: parts[3],
            category: parts[4],
            confidence: 1.0  // User explicitly selected, high confidence
          }
        };
      }
    }

    // SELECT_PROVIDER|Provider
    if (id.startsWith('SELECT_PROVIDER|')) {
      return {
        intent: LLMIntent.SUBSCRIBE,
        data: { provider: id.replace('SELECT_PROVIDER|', '') }
      };
    }

    // SELECT_DURATION|Duration
    if (id.startsWith('SELECT_DURATION|')) {
        const duration = parseInt(id.replace('SELECT_DURATION|', ''), 10);
        return {
            intent: LLMIntent.SUBSCRIBE,
            data: { duration }
        };
    }

    // 3. Fallback: If it's a raw intent name, pass it through
    if (Object.values(LLMIntent).includes(id as any)) {
      return { intent: id, data: {} };
    }

    return null;
  }
}
