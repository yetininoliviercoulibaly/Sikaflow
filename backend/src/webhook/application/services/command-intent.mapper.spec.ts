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
        missing_fields: ['amount'],
      });

      const incomeMapping = mapper.map('CMD_TX_INCOME');
      expect(incomeMapping).toEqual({
        intent: LLMIntent.CREATE_TRANSACTION,
        data: { type: 'INCOME' },
        missing_fields: ['amount'],
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
  });
});
