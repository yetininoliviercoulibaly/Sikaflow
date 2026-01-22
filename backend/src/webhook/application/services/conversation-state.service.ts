import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

export interface PendingAction {
  intent: string;
  data: Record<string, any>;
  missing_fields: string[];
  createdAt: Date;
}

/**
 * Redis-backed conversation state service.
 * Stores pending actions for users to maintain context between messages.
 */
@Injectable()
export class ConversationStateService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ConversationStateService.name);
  private redisClient: Redis;
  private readonly REDIS_PREFIX = 'conversation_state:';
  
  // Actions expire after 10 minutes
  private readonly TTL_SECONDS = 10 * 60;

  onModuleInit() {
    this.redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    });
  }

  onModuleDestroy() {
    this.redisClient.disconnect();
  }

  /**
   * Store a pending action for a user
   */
  async setPendingAction(userIdentifier: string, action: PendingAction): Promise<void> {
    const key = `${this.REDIS_PREFIX}${userIdentifier}`;
    const payload = {
      ...action,
      createdAt: new Date(),
    };
    await this.redisClient.set(key, JSON.stringify(payload), 'EX', this.TTL_SECONDS);
    this.logger.debug(`Set pending action for ${userIdentifier}`);
  }

  /**
   * Get and optionally clear the pending action for a user
   */
  async getPendingAction(userIdentifier: string, clear = false): Promise<PendingAction | null> {
    const key = `${this.REDIS_PREFIX}${userIdentifier}`;
    const data = await this.redisClient.get(key);
    
    if (!data) {
      return null;
    }

    if (clear) {
      await this.redisClient.del(key);
    }

    const parsed = JSON.parse(data);
    return {
      ...parsed,
      createdAt: new Date(parsed.createdAt), // Rehydrate Date object
    };
  }

  /**
   * Update the data of a pending action
   */
  async updatePendingAction(userIdentifier: string, newData: Record<string, any>, removeField?: string): Promise<void> {
    const action = await this.getPendingAction(userIdentifier);
    if (!action) return;

    action.data = { ...action.data, ...newData };
    
    if (removeField && action.missing_fields.includes(removeField)) {
      action.missing_fields = action.missing_fields.filter(f => f !== removeField);
    }

    // TTL resets on update (active conversation)
    await this.setPendingAction(userIdentifier, action);
  }

  /**
   * Clear pending action for a user
   */
  async clearPendingAction(userIdentifier: string): Promise<void> {
    const key = `${this.REDIS_PREFIX}${userIdentifier}`;
    await this.redisClient.del(key);
  }
}

