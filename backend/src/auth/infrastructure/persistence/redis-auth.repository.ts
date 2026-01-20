import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { MagicLinkToken } from '../../domain/magic-link-token.entity';
import { IAuthRepository } from '../../domain/ports/auth.repository.interface';

@Injectable()
export class RedisAuthRepository implements IAuthRepository, OnModuleInit, OnModuleDestroy {
  private redisClient: Redis;
  private readonly REDIS_PREFIX = 'magic_link:';

  onModuleInit() {
    // Ideally inject ConfigService, but for MVP strictly following prompt constraints
    this.redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    });
  }

  onModuleDestroy() {
    this.redisClient.disconnect();
  }

  async save(token: MagicLinkToken): Promise<void> {
    const key = `${this.REDIS_PREFIX}${token.token}`;
    const ttl = Math.floor((token.expiresAt.getTime() - Date.now()) / 1000);
    
    if (ttl > 0) {
      await this.redisClient.set(key, JSON.stringify(token), 'EX', ttl);
    }
  }

  async findByToken(token: string): Promise<MagicLinkToken | null> {
    const key = `${this.REDIS_PREFIX}${token}`;
    const data = await this.redisClient.get(key);

    if (!data) return null;

    const parsed = JSON.parse(data);
    return new MagicLinkToken(
      parsed.token,
      parsed.phoneNumber,
      new Date(parsed.expiresAt),
      parsed.isUsed,
      parsed.firstUsedAt ? new Date(parsed.firstUsedAt) : null,
    );
  }

  async update(token: MagicLinkToken): Promise<void> {
    // Redis overwrites key
    await this.save(token);
  }
}
