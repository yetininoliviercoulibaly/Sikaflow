import { Test, TestingModule } from '@nestjs/testing';
import { CommandIntentMapper } from './command-intent.mapper';
import { LLMIntent } from '../../../common/llm/llm-types';

describe('CommandIntentMapper', () => {
  let mapper: CommandIntentMapper;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CommandIntentMapper],
    }).compile();

    mapper = module.get<CommandIntentMapper>(CommandIntentMapper);
  });

  it('should be defined', () => {
    expect(mapper).toBeDefined();
  });

  describe('map', () => {
    it('should map standard command IDs to correct intents', () => {
      const expenseMapping = mapper.map('CMD_TX_EXPENSE');
      expect(expenseMapping).toEqual({
        intent: LLMIntent.CREATE_TRANSACTION,
        data: { type: 'EXPENSE' },
        missing_fields: ['amount', 'category'],
      });

      const incomeMapping = mapper.map('CMD_TX_INCOME');
      expect(incomeMapping).toEqual({
        intent: LLMIntent.CREATE_TRANSACTION,
        data: { type: 'INCOME' },
        missing_fields: ['amount', 'category'],
      });

      const helpMapping = mapper.map('HELP_CMD');
      expect(helpMapping?.intent).toBe(LLMIntent.HELP);
    });

    it('should handle SWITCH_ORG_ID_ prefix', () => {
      const orgId = '12345';
      const result = mapper.map(`SWITCH_ORG_ID_${orgId}`);
      expect(result).toEqual({
        intent: LLMIntent.SWITCH_ORGANIZATION,
        data: { targetOrganizationId: orgId },
      });
    });

    it('should parse CONFIRM_TX| pipe-separated data', () => {
      const id = 'CONFIRM_TX|50.5|EUR|EXPENSE|Food';
      const result = mapper.map(id);
      expect(result).toEqual({
        intent: LLMIntent.CREATE_TRANSACTION,
        data: {
          amount: 50.5,
          currency: 'EUR',
          type: 'EXPENSE',
          category: 'Food',
          confidence: 1.0,
        },
      });
    });

    it('should parse SELECT_PROVIDER| data', () => {
        const id = 'SELECT_PROVIDER|STRIPE';
        const result = mapper.map(id);
        expect(result).toEqual({
            intent: LLMIntent.SUBSCRIBE,
            data: { provider: 'STRIPE' }
        });
    });

    it('should parse SELECT_DURATION| data', () => {
        const id = 'SELECT_DURATION|12';
        const result = mapper.map(id);
        expect(result).toEqual({
            intent: LLMIntent.SUBSCRIBE,
            data: { duration: 12 }
        });
    });

    it('should handle FEEDBACK| prefix', () => {
      const result = mapper.map('FEEDBACK|5');
      expect(result).toEqual({
        intent: 'PROVIDE_FEEDBACK',
        data: { rating: 5, confidence: 1.0 },
      });
    });

    it('should fallback to raw intent if ID is a valid LLMIntent', () => {
      const result = mapper.map(LLMIntent.GREETING);
      expect(result).toEqual({
        intent: LLMIntent.GREETING,
        data: {},
      });
    });

    it('should return null for unknown IDs', () => {
      expect(mapper.map('UNKNOWN_STUFF_123')).toBeNull();
      expect(mapper.map('')).toBeNull();
    });
    it('should map CONFIRM_DEL|NO to CANCEL_DELETION intent', () => {
      const result = mapper.map('CONFIRM_DEL|NO');
      expect(result).toEqual({
        intent: LLMIntent.CANCEL_DELETION,
        data: {},
      });
    });

    it('should map CONFIRM_DEL|YES to EXECUTE_DELETION intent', () => {
        const result = mapper.map('CONFIRM_DEL|YES|tx-123');
        expect(result).toEqual({
            intent: LLMIntent.EXECUTE_DELETION,
            data: { transactionId: 'tx-123' },
        });
    });

    // Debt Recovery Tests
    it('should map CMD_ADD_DEBT to ADD_DEBT intent', () => {
      const result = mapper.map('CMD_ADD_DEBT');
      expect(result).toEqual({ intent: LLMIntent.ADD_DEBT, data: {} });
    });

    it('should map CMD_LIST_DEBTS to LIST_DEBTS intent', () => {
      const result = mapper.map('CMD_LIST_DEBTS');
      expect(result).toEqual({ intent: LLMIntent.LIST_DEBTS, data: {} });
    });

    it('should map CMD_LIST_CREDITS to LIST_CREDITS intent', () => {
      const result = mapper.map('CMD_LIST_CREDITS');
      expect(result).toEqual({ intent: LLMIntent.LIST_CREDITS, data: {} });
    });

    it('should map CMD_SETTLE_DEBT to SETTLE_DEBT intent', () => {
      const result = mapper.map('CMD_SETTLE_DEBT');
      expect(result).toEqual({
        intent: LLMIntent.SETTLE_DEBT,
        data: {},
        missing_fields: ['contact_name', 'amount'],
      });
    });
  });
});
