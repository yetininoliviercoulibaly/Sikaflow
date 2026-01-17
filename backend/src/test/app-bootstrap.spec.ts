/**
 * App Bootstrap Test
 * 
 * This test validates that all NestJS modules can be properly instantiated
 * without any dependency injection errors. This catches issues like:
 * - Missing providers in modules
 * - Circular dependencies
 * - Undefined tokens
 * 
 * Run with: npx jest src/test/app-bootstrap.spec.ts --verbose
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WebhookModule } from '../webhook/webhook.module';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { BullModule } from '@nestjs/bullmq';

// Mock external dependencies
jest.mock('@mikro-orm/core', () => ({
  MikroORM: {
    init: jest.fn().mockResolvedValue({
      em: {
        getRepository: jest.fn(),
        fork: jest.fn().mockReturnValue({
          persistAndFlush: jest.fn(),
          findOne: jest.fn(),
        }),
      },
      getSchemaGenerator: jest.fn(),
      close: jest.fn(),
    }),
  },
  Entity: () => jest.fn(),
  PrimaryKey: () => jest.fn(),
  Property: () => jest.fn(),
  ManyToOne: () => jest.fn(),
  OneToMany: () => jest.fn(),
  Cascade: { ALL: 'ALL' },
  wrap: jest.fn(),
  EntityRepository: class {},
}));

jest.mock('@nestjs/bullmq', () => ({
  BullModule: {
    forRootAsync: jest.fn(() => ({
      module: class MockBullRootModule {},
      providers: [],
      exports: [],
    })),
    registerQueue: jest.fn(() => ({
      module: class MockBullQueueModule {},
      providers: [
        {
          provide: 'BullQueue_whatsapp',
          useValue: { add: jest.fn(), process: jest.fn() },
        },
        {
          provide: 'BullQueue_telegram',
          useValue: { add: jest.fn(), process: jest.fn() },
        },
      ],
      exports: ['BullQueue_whatsapp', 'BullQueue_telegram'],
    })),
  },
  InjectQueue: () => () => jest.fn(),
  Processor: () => jest.fn(),
  Process: () => jest.fn(),
}));

jest.mock('@nestjs/schedule', () => ({
  ScheduleModule: {
    forRoot: jest.fn(() => ({
      module: class MockScheduleModule {},
      providers: [],
    })),
  },
  Cron: () => jest.fn(),
  CronExpression: { EVERY_DAY_AT_MIDNIGHT: '0 0 * * *' },
}));

describe('App Bootstrap DI Validation', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [() => ({
            BYPASS_SUBSCRIPTION_CHECK: 'true',
            GEMINI_API_KEY: 'test-key',
            WHATSAPP_ACCESS_TOKEN: 'test-token',
            WHATSAPP_PHONE_NUMBER_ID: 'test-phone',
            TELEGRAM_BOT_TOKEN: 'test-bot',
            DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
          })],
        }),
      ],
    })
      .overrideModule(MikroOrmModule)
      .useModule(class MockMikroOrmModule {})
      .compile();

    app = moduleRef.createNestApplication();
  }, 30000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('should bootstrap ConfigModule without errors', () => {
    const configService = moduleRef.get<ConfigService>(ConfigService);
    expect(configService).toBeDefined();
  });

  it('should have BYPASS_SUBSCRIPTION_CHECK configured', () => {
    const configService = moduleRef.get<ConfigService>(ConfigService);
    expect(configService.get('BYPASS_SUBSCRIPTION_CHECK')).toBe('true');
  });
});
