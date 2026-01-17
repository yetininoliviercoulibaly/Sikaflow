import { Test, TestingModule } from '@nestjs/testing';
import { ConversationalGuidanceService } from '../../application/services/conversational-guidance.service';
import { LLMIntent } from '../../../common/llm/llm-types';
import { MessagingPlatforms } from '../../../common/messaging/domain/constants/messaging-platforms.enum';

describe('ConversationalGuidanceService', () => {
  let service: ConversationalGuidanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConversationalGuidanceService],
    }).compile();

    service = module.get<ConversationalGuidanceService>(ConversationalGuidanceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getGuidance', () => {
    it('should return guided prompt for missing amount in transactions', () => {
      const result = service.getGuidance(
        LLMIntent.CREATE_TRANSACTION,
        'amount',
        MessagingPlatforms.WHATSAPP,
        { type: 'EXPENSE' }
      );
      expect(result.message).toContain("Quel est le montant de cette dépense");
    });

    it('should return interactive buttons for missing category in transactions with encoded context', () => {
      const result = service.getGuidance(
        LLMIntent.CREATE_TRANSACTION,
        'category',
        MessagingPlatforms.TELEGRAM,
        { type: 'EXPENSE', amount: 50, currency: 'EUR' }
      );
      expect(result.message).toContain("Dans quelle catégorie");
      expect(result.buttons).toBeDefined();
      expect(result.buttons?.length).toBeGreaterThan(3); // Telegram gets more
      // Verify button IDs contain encoded context
      expect(result.buttons?.[0].id).toContain('SELECT_CAT|EXPENSE|50|EUR|');
    });

    it('should limit buttons to 3 for WhatsApp categories with encoded context', () => {
        const result = service.getGuidance(
          LLMIntent.CREATE_TRANSACTION,
          'category',
          MessagingPlatforms.WHATSAPP,
          { type: 'INCOME', amount: 100, currency: 'XOF' }
        );
        expect(result.buttons?.length).toBe(3);
        expect(result.buttons?.[0].id).toContain('SELECT_CAT|INCOME|100|XOF|');
      });

    it('should return friendly prompt for organization name', () => {
      const result = service.getGuidance(
        LLMIntent.CREATE_ORGANIZATION,
        'name',
        MessagingPlatforms.WHATSAPP
      );
      expect(result.message).toContain("Comment s'appelle votre organisation");
    });

    it('should fallback to generic prompt for unknown fields', () => {
      const result = service.getGuidance(
        'UNKNOWN_INTENT',
        'unknown_field',
        MessagingPlatforms.WHATSAPP
      );
      expect(result.message).toContain("Il manque une information (unknown_field)");
    });
  });
});
