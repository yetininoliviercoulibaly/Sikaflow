import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { BusinessIntelligenceService } from '../report/application/services/business-intelligence.service';
import { UserRole } from '../organization/domain/organization-member.entity';

async function verifyUS10() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const biService = app.get(BusinessIntelligenceService);

  try {
    console.log('--- STARTING US.10 VERIFICATION (Access Control) ---');

    // Test 1: STAFF requests MARGIN -> DENIED
    console.log('\nTest 1: STAFF requests MARGIN metric...');
    const staffResult = await biService.getMetric(undefined, 'MARGIN', 'today', undefined, UserRole.STAFF);
    console.log(`Result: ${staffResult}`);
    
    if (!staffResult.includes('Accès refusé')) {
        throw new Error('FAILED: STAFF should be blocked from MARGIN');
    }
    console.log('✅ STAFF correctly blocked from MARGIN');

    // Test 2: OWNER requests MARGIN -> ALLOWED (will return metric or "unknown metric" since not implemented, but NOT blocked)
    console.log('\nTest 2: OWNER requests MARGIN metric...');
    const ownerResult = await biService.getMetric(undefined, 'MARGIN', 'today', undefined, UserRole.OWNER);
    console.log(`Result: ${ownerResult}`);
    
    if (ownerResult.includes('Accès refusé')) {
        throw new Error('FAILED: OWNER should NOT be blocked from MARGIN');
    }
    console.log('✅ OWNER correctly allowed to access MARGIN');

    // Test 3: STAFF requests REVENUE -> ALLOWED (not sensitive)
    console.log('\nTest 3: STAFF requests REVENUE metric...');
    const staffRevenueResult = await biService.getMetric(undefined, 'REVENUE', 'today', undefined, UserRole.STAFF);
    console.log(`Result: ${staffRevenueResult}`);
    
    if (staffRevenueResult.includes('Accès refusé')) {
        throw new Error('FAILED: STAFF should be allowed to access REVENUE');
    }
    console.log('✅ STAFF correctly allowed to access REVENUE');

    console.log('\n--- US.10 VERIFIED SUCCESSFULLY ---');

  } catch (error) {
    console.error('❌ VERIFICATION FAILED:', error);
  } finally {
    await app.close();
  }
}

verifyUS10();
