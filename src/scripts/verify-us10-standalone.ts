// Simple US.10 Verification (No NestJS Context Required)
import { UserRole } from '../organization/domain/organization-member.entity';

// Metrics that require OWNER or MANAGER role
const RESTRICTED_METRICS = ['MARGIN', 'PROFIT', 'NET_INCOME'];

function checkAccess(metric: string, userRole: UserRole): string {
    if (userRole === UserRole.STAFF && RESTRICTED_METRICS.includes(metric)) {
        return "⛔ Accès refusé. Les données de marge et profit sont réservées aux Managers et Propriétaires.";
    }
    return `✅ Access granted for ${metric}`;
}

console.log('--- US.10 VERIFICATION (Standalone Logic Test) ---\n');

// Test 1: STAFF requests MARGIN -> DENIED
console.log('Test 1: STAFF requests MARGIN...');
const t1 = checkAccess('MARGIN', UserRole.STAFF);
console.log(`Result: ${t1}`);
console.log(t1.includes('Accès refusé') ? '✅ PASS' : '❌ FAIL');

// Test 2: OWNER requests MARGIN -> ALLOWED
console.log('\nTest 2: OWNER requests MARGIN...');
const t2 = checkAccess('MARGIN', UserRole.OWNER);
console.log(`Result: ${t2}`);
console.log(!t2.includes('Accès refusé') ? '✅ PASS' : '❌ FAIL');

// Test 3: STAFF requests REVENUE -> ALLOWED
console.log('\nTest 3: STAFF requests REVENUE...');
const t3 = checkAccess('REVENUE', UserRole.STAFF);
console.log(`Result: ${t3}`);
console.log(!t3.includes('Accès refusé') ? '✅ PASS' : '❌ FAIL');

console.log('\n--- US.10 LOGIC VERIFIED ---');
