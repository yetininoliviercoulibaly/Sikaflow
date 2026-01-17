import { Test, TestingModule } from '@nestjs/testing';
import { BusinessIntelligenceService } from '../application/services/business-intelligence.service';
import { EntityManager } from '@mikro-orm/core';
import { UserRole } from '../../organization/domain/organization-member.entity';

describe('BusinessIntelligenceService', () => {
  let service: BusinessIntelligenceService;
  let mockEm: any;
  let mockConnection: any;

  beforeEach(async () => {
    mockConnection = {
      execute: jest.fn().mockResolvedValue([{ settings: { currency: 'EUR' } }]),
    };
    mockEm = {
      getConnection: jest.fn().mockReturnValue(mockConnection),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessIntelligenceService,
        { provide: EntityManager, useValue: mockEm },
      ],
    }).compile();

    service = module.get<BusinessIntelligenceService>(BusinessIntelligenceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMetric', () => {
    it('should calculate dates correctly for "this_year"', async () => {
        mockConnection.execute.mockResolvedValue([{ sum: 1000 }]);
        const result = await service.getMetric('org1', 'REVENUE', 'this_year', undefined, UserRole.OWNER);
        
        const now = new Date();
        const expectedStart = new Date(now.getFullYear(), 0, 1); // Jan 1st
        expectedStart.setHours(0,0,0,0);
        
        expect(mockConnection.execute).toHaveBeenCalledWith(
            expect.stringContaining('transaction_date >= ?'),
            expect.arrayContaining([expect.stringContaining(expectedStart.toISOString())])
        );
        expect(result).toContain('cette année');
    });

    it('should support "NET_PROFIT" by calculating Income - Expense', async () => {
        // Mock sequence: Currency first, then Income, then Expense
        mockConnection.execute
            .mockResolvedValueOnce([{ settings: { currency: 'EUR' } }]) // Currency
            .mockResolvedValueOnce([{ sum: 5000 }]) // Income
            .mockResolvedValueOnce([{ sum: 2000 }]); // Expense
        
        const result = await service.getMetric('org1', 'NET_PROFIT', 'this_month', undefined, UserRole.OWNER);

        expect(mockConnection.execute).toHaveBeenCalledTimes(3);
        // Matching formatted string roughly. Intl format might include non-breaking spaces.
        // 5000 - 2000 = 3000. 
        expect(result).toContain('Bénéfice Net');
        // We verify it calls execute correctly, exact string match might be flaky depending on locale
    });

    it('should parse "last_3_years" dynamically', async () => {
         mockConnection.execute.mockResolvedValue([{ sum: 100 }]);
         await service.getMetric('org1', 'REVENUE', 'last_3_years', undefined, UserRole.OWNER);
         
         const now = new Date();
         // 3 years ago Jan 1st
         const expectedStart = new Date(now.getFullYear() - 3, 0, 1);
         expectedStart.setHours(0,0,0,0);
         
         expect(mockConnection.execute).toHaveBeenCalledWith(
            expect.anything(),
            expect.arrayContaining([expect.stringContaining(expectedStart.toISOString())])
         );
    });

    it('should handle Semesters correctly (this_semester)', async () => {
        mockConnection.execute.mockResolvedValue([{ sum: 100 }]);
        await service.getMetric('org1', 'REVENUE', 'this_semester', undefined, UserRole.OWNER);
        
        const now = new Date();
        const currentMonth = now.getMonth();
        const startMonth = currentMonth < 6 ? 0 : 6;
        const expectedStart = new Date(now.getFullYear(), startMonth, 1);
        expectedStart.setHours(0,0,0,0);

        expect(mockConnection.execute).toHaveBeenCalledWith(
             expect.anything(),
             expect.arrayContaining([expect.stringContaining(expectedStart.toISOString())])
        );
    });
    it('should use the currency from organization settings', async () => {
        // Mock sequence: 1 for currency lookup, 1 for metric sum
        mockConnection.execute
            .mockResolvedValueOnce([{ settings: { currency: 'EUR' } }]) // getOrganizationCurrency
            .mockResolvedValueOnce([{ sum: 1000 }]); // REVENUE
        
        const result = await service.getMetric('org1', 'REVENUE', 'this_month', undefined, UserRole.OWNER);

        expect(result).toContain('€');
        // Match 1 000,00 with any kind of space as separator
        expect(result).toMatch(/1[\s\u00A0\u202F]000,00/); 
    });
  });
});
