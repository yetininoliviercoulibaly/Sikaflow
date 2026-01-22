import { Test, TestingModule } from '@nestjs/testing';
import { MessageExtractionService } from './message-extraction.service';

describe('MessageExtractionService', () => {
    let service: MessageExtractionService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [MessageExtractionService],
        }).compile();

        service = module.get<MessageExtractionService>(MessageExtractionService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('applyHeuristics', () => {
        it('should extract amounts correctly', () => {
            const result = service.applyHeuristics('200 euros', {
                intent: 'CREATE_TRANSACTION',
                missing_fields: ['amount'],
                data: {}
            }, {});
            expect(result.amount).toBe(200);
        });

        it('should extract correct date from relative keywords', () => {
             const result = service.applyHeuristics('demain', {
                 intent: 'CREATE_EVENT',
                 missing_fields: ['date'],
                 data: {}
             }, {});
             expect(result.date).toBeDefined();
             // Just checking it's an ISO string
             expect(new Date(result.date as string).getTime()).toBeGreaterThan(Date.now());
        });
    });

    describe('cleanupName', () => {
        it('should remove prefixes', () => {
            expect(service.cleanupName("c'est mon super event")).toBe('mon super event');
            expect(service.cleanupName("l'événement s'appelle Super Fête")).toBe('Super Fête');
            expect(service.cleanupName("Super Fête")).toBe('Super Fête');
        });
    });
});
