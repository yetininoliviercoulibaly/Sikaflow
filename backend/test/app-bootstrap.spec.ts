import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';

describe('AppBootstrap (Integration)', () => {
  let app: any;

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('should compile the entire application modules (DI Check)', async () => {
    // This integration test verifies that the AppModule and all its dependencies
    // can be resolved by the NestJS Injector.
    // If this passes, it means there are no "UnknownDependenciesException" or circular dependency errors.
    
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    expect(moduleFixture).toBeDefined();

    // Note: We do not call app.init() here to avoid requiring a running Redis/Database instance
    // just to verify the Dependency Injection graph.
    // If you have infrastructure running, you can uncomment the line below:
    // app = moduleFixture.createNestApplication();
    // await app.init();
  }, 60000);
});
