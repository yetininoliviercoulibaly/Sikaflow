
import { WhatsAppSignatureGuard } from '../webhook/application/guards/whatsapp-signature.guard';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import * as crypto from 'crypto';

// --- Mocks ---
const mockContext = (headers: any, rawBody?: Buffer) => {
    return {
        switchToHttp: () => ({
            getRequest: () => ({
                headers,
                rawBody
            })
        })
    } as unknown as ExecutionContext;
};

// --- Tests ---
async function verifySecurity() {
    console.log('--- STARTING SECURITY VERIFICATION ---');

    // 1. WhatsApp Signature Guard
    console.log('\nTesting WhatsAppSignatureGuard...');
    const whatsAppGuard = new WhatsAppSignatureGuard();
    
    // Setup Env
    process.env.WHATSAPP_APP_SECRET = 'test_secret';
    process.env.WHATSAPP_VERIFY_SIGNATURE = 'true';

    // 1.1 Valid Signature
    try {
        const body = Buffer.from(JSON.stringify({ test: 'data' }));
        const signature = 'sha256=' + crypto.createHmac('sha256', 'test_secret').update(body).digest('hex');
        
        const context = mockContext({ 'x-hub-signature-256': signature }, body);
        const result = whatsAppGuard.canActivate(context);
        if (result === true) console.log('✅ Valid Signature: PASSED');
    } catch (e) {
        console.error('❌ Valid Signature: FAILED', e);
    }

    // 1.2 Invalid Signature
    try {
        const body = Buffer.from(JSON.stringify({ test: 'data' }));
        const context = mockContext({ 'x-hub-signature-256': 'sha256=invalid' }, body);
        whatsAppGuard.canActivate(context);
        console.error('❌ Invalid Signature: FAILED (Should have thrown)');
    } catch (e) {
        if (e instanceof ForbiddenException) console.log('✅ Invalid Signature: PASSED (Caught ForbiddenException)');
        else console.error('❌ Invalid Signature: FAILED (Wrong error)', e);
    }

    // 1.3 Missing Signature
    try {
        const body = Buffer.from('data');
        const context = mockContext({}, body);
        whatsAppGuard.canActivate(context);
        console.error('❌ Missing Signature: FAILED (Should have thrown)');
    } catch (e) {
        if (e instanceof ForbiddenException) console.log('✅ Missing Signature: PASSED (Caught ForbiddenException)');
    }

    // 1.4 Bypass Mode
    try {
        process.env.WHATSAPP_VERIFY_SIGNATURE = 'false';
        const context = mockContext({}); // No headers
        const result = whatsAppGuard.canActivate(context);
        if (result === true) console.log('✅ Bypass Mode: PASSED');
    } catch (e) {
        console.error('❌ Bypass Mode: FAILED', e);
    }
    // Reset Env
    process.env.WHATSAPP_VERIFY_SIGNATURE = 'true';


    // 2. ApiKey Guard
    console.log('\nTesting ApiKeyGuard...');
    const apiKeyGuard = new ApiKeyGuard();
    process.env.ADMIN_API_KEY = 'secure_key_123';

    // 2.1 Valid Key
    try {
        const context = mockContext({ 'x-api-key': 'secure_key_123' });
        const result = apiKeyGuard.canActivate(context);
        if (result === true) console.log('✅ Valid API Key: PASSED');
    } catch (e) {
        console.error('❌ Valid API Key: FAILED', e);
    }

    // 2.2 Invalid Key
    try {
        const context = mockContext({ 'x-api-key': 'wrong_key' });
        apiKeyGuard.canActivate(context);
        console.error('❌ Invalid API Key: FAILED (Should have thrown)');
    } catch (e) {
        if (e instanceof ForbiddenException) console.log('✅ Invalid API Key: PASSED (Caught ForbiddenException)');
    }

    // 2.3 Missing Key
    try {
        const context = mockContext({});
        apiKeyGuard.canActivate(context);
        console.error('❌ Missing API Key: FAILED (Should have thrown)');
    } catch (e) {
        if (e instanceof ForbiddenException) console.log('✅ Missing API Key: PASSED (Caught ForbiddenException)');
    }

    console.log('\n--- SECURITY VERIFICATION COMPLETE ---');
}

verifySecurity();
