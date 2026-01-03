import { Test, TestingModule } from '@nestjs/testing';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ConfigModule } from '@nestjs/config';
import { PaymentWebhookController } from '../payment/application/controllers/payment-webhook.controller';
import { CheckSubscriptionUseCase } from '../subscription/application/use-cases/check-subscription.use-case';
import { I_SUBSCRIPTION_REPOSITORY } from '../subscription/domain/ports/subscription.repository.interface';
import { I_EVENT_PASS_REPOSITORY } from '../subscription/domain/ports/event-pass.repository.interface';
import { I_ORGANIZATION_REPOSITORY } from '../organization/domain/ports/organization.repository.interface';
import { I_USER_REPOSITORY } from '../user/domain/ports/user.repository.interface';
import { ActivateEventPassUseCase } from '../subscription/application/use-cases/activate-event-pass.use-case';
import { WhatsAppService } from '../common/whatsapp/whatsapp.service';
import { SubscriptionModule } from '../subscription/subscription.module';
import { OrganizationModule } from '../organization/organization.module';
import { UserModule } from '../user/user.module';
import { PaymentModule } from '../payment/payment.module';
import { PAYMENT_PROVIDER_TOKEN } from '../payment/domain/ports/payment-provider.interface';
import config from '../mikro-orm.config';
import { v4 } from 'uuid';

// Simple Mock Implementation
const createMockFn = (returnValue?: any) => {
    const fn: any = (...args: any[]) => {
        fn.calls.push(args);
        return Promise.resolve(fn.returnValue !== undefined ? fn.returnValue : returnValue);
    };
    fn.calls = [] as any[][];
    fn.returnValue = returnValue;
    fn.mockResolvedValue = (val: any) => {
        fn.returnValue = val;
        return fn; 
    }
    return fn;
};

// Mock WhatsApp Service
const mockWhatsAppService = {
  sendMessage: createMockFn(true),
};

async function verifyUS12() {
  const orgId = '550e8400-e29b-41d4-a716-446655440000'; 

  // Mock Repos
  const mockSubRepo = {
    findByOrganizationId: createMockFn(null),
    create: createMockFn({ id: 'sub-1' }),
    update: createMockFn({ id: 'sub-1' }),
  };

  const mockOrgRepo = {
    findOwner: createMockFn({ userId: 'user-1' }),
    findById: createMockFn({ id: orgId, name: 'Test Org' }),
  };

  const mockUserRepo = {
    findById: createMockFn({ phoneNumber: '1234567890' }),
  };

  const mockPassRepo = {
    findActiveForOrganization: createMockFn(null),
    create: createMockFn({}),
  };

  const mockPaymentProvider = {
      verifyPayment: createMockFn(true),
      createPaymentLink: createMockFn('http://mock-link'),
  };

  const moduleRefMock: TestingModule = await Test.createTestingModule({
      controllers: [PaymentWebhookController],
      providers: [
          CheckSubscriptionUseCase,
          ActivateEventPassUseCase,
          { provide: I_SUBSCRIPTION_REPOSITORY, useValue: mockSubRepo },
          { provide: I_ORGANIZATION_REPOSITORY, useValue: mockOrgRepo },
          { provide: I_USER_REPOSITORY, useValue: mockUserRepo },
          { provide: I_EVENT_PASS_REPOSITORY, useValue: mockPassRepo },
          { provide: WhatsAppService, useValue: mockWhatsAppService },
          { provide: PAYMENT_PROVIDER_TOKEN, useValue: mockPaymentProvider }
      ]
  }).compile();

  const controllerMock = moduleRefMock.get<PaymentWebhookController>(PaymentWebhookController);
  const checkUseCaseMock = moduleRefMock.get<CheckSubscriptionUseCase>(CheckSubscriptionUseCase);

  console.log('--- Verifying US.12 (Subscription) ---');

  // 1. Simulate Webhook for Subscription
  console.log('1. Simulating Wave Webhook for Subscription...');
  await controllerMock.handleWaveWebhook({
      type: 'checkout.session.completed',
      data: {
          id: 'wave-ref-123',
          client_reference: orgId,
          metadata: { organizationId: orgId, type: 'SUBSCRIPTION' }
      }
  }, 'sig');

  // Verify create was called on repo
  try {
      if (mockSubRepo.create.calls.length > 0) {
          console.log('✅ Subscription Access Saved (Repository.create called)');
      } else {
          console.error('❌ Subscription NOT saved.');
      }
  } catch(e) { console.error(e); }

  // 2. Simulate Check Subscription (Mocking repo return)
  console.log('2. Verifying Access Check...');
  
  // Update mock return manually since we made simple mock
  mockSubRepo.findByOrganizationId.mockResolvedValue({
      status: 'ACTIVE',
      currentPeriodEnd: new Date(Date.now() + 10000000), // Valid in future
  });
  
  const accessResult = await checkUseCaseMock.execute({ organizationId: orgId });
  if (accessResult.hasAccess && accessResult.reason.includes('Abonnement')) {
      console.log('✅ Access Granted via Subscription');
  } else if (accessResult.hasAccess) {
       console.warn('⚠️ Access Granted but wrong reason:', accessResult.reason);
  } else {
      console.error('❌ Access Denied', accessResult);
  }

  console.log('--- US.12 Verification Complete ---');
}

verifyUS12();
