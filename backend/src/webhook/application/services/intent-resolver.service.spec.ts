import { IntentResolverService } from './intent-resolver.service';
import { LLMIntent } from '../../../common/llm/llm-types';

describe('IntentResolverService', () => {
  let service: IntentResolverService;

  beforeEach(() => {
    service = new IntentResolverService();
  });

  it('should resolve CLAIM- token', () => {
    const result = service.resolveHeuristicIntent('CLAIM-12345');
    expect(result?.intent).toBe(LLMIntent.CLAIM_TICKET);
    expect(result?.data!.token).toBe('CLAIM-12345');
  });

  it('should resolve STOP keyword', () => {
    expect(service.resolveHeuristicIntent('STOP')?.intent).toBe(LLMIntent.UNKNOWN);
    expect(service.resolveHeuristicIntent('ANNULER')?.intent).toBe(LLMIntent.UNKNOWN);
    expect(service.resolveHeuristicIntent("J'AI CHANGÉ D'AVIS")?.intent).toBe(LLMIntent.UNKNOWN);
  });

  it('should resolve HELP keyword', () => {
    expect(service.resolveHeuristicIntent('AIDE')?.intent).toBe(LLMIntent.HELP);
    expect(service.resolveHeuristicIntent('MENU')?.intent).toBe(LLMIntent.HELP);
  });

  it('should return null for normal text', () => {
    expect(service.resolveHeuristicIntent('Hello world')).toBeNull();
    expect(service.resolveHeuristicIntent('Recette de 500 euros')).toBeNull();
  });

  it('should suggest override for high confidence new intent', () => {
    const analysis = { intent: LLMIntent.CREATE_TRANSACTION, confidence: 0.9 } as any;
    expect(service.shouldOverridePending(analysis, LLMIntent.ADD_MEMBER)).toBe(true);
  });

  it('should NOT suggest override for low confidence new intent', () => {
    const analysis = { intent: LLMIntent.CREATE_TRANSACTION, confidence: 0.7 } as any;
    expect(service.shouldOverridePending(analysis, LLMIntent.ADD_MEMBER)).toBe(false);
  });
});
