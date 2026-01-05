import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../app.module';
import { JwtTokenService } from '../auth/infrastructure/token/jwt-token.service';

describe('Hybrid Auth Verification (E2E)', () => {
  let app: INestApplication;
  let jwtService: JwtTokenService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
    jwtService = app.get(JwtTokenService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('1. Should return 401 when no credentials provided', async () => {
    await request(app.getHttpServer())
      .post('/organizations')
      .expect(401);
  });

  it('2. Should return 400 (Auth Passed) when valid API Key provided', async () => {
    const apiKey = process.env.ADMIN_API_KEY || 'admin';
    await request(app.getHttpServer())
      .post('/organizations')
      .set('x-api-key', apiKey)
      .expect(400); // Bad Request means DTO failed but Auth passed
  });

  it('3. Should return 400 (Auth Passed) when valid JWT provided', async () => {
    const validJwt = jwtService.generateJwt({ sub: 'test-user', role: 'ADMIN' });
    await request(app.getHttpServer())
      .post('/organizations')
      .set('Authorization', `Bearer ${validJwt}`)
      .expect(400);
  });

  it('4. Should return 401 when Invalid API Key provided', async () => {
    await request(app.getHttpServer())
      .post('/organizations')
      .set('x-api-key', 'WRONG_KEY')
      .expect(401);
  });

  it('5. Should return 403 when JWT has insufficient role', async () => {
    const userJwt = jwtService.generateJwt({ sub: 'test-user', role: 'USER' });
    await request(app.getHttpServer())
      .post('/organizations')
      .set('Authorization', `Bearer ${userJwt}`)
      .expect(403);
  });
});
