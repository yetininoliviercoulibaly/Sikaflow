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

    it('should return interactive buttons for missing category in transactions', () => {
      const result = service.getGuidance(
        LLMIntent.CREATE_TRANSACTION,
        'category',
        MessagingPlatforms.TELEGRAM,
        { type: 'EXPENSE' }
      );
      expect(result.message).toContain("Dans quelle catégorie");
      expect(result.buttons).toBeDefined();
      expect(result.buttons?.length).toBeGreaterThan(3); // Telegram gets more
    });

    it('should limit buttons to 3 for WhatsApp categories', () => {
        const result = service.getGuidance(
          LLMIntent.CREATE_TRANSACTION,
          'category',
          MessagingPlatforms.WHATSAPP,
          { type: 'EXPENSE' }
        );
        expect(result.buttons?.length).toBe(3);
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
