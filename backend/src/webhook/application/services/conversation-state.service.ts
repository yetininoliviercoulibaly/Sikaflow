import { Injectable, Logger } from '@nestjs/common';

export interface PendingAction {
  intent: string;
  data: Record<string, any>;
  missing_fields: string[];
  createdAt: Date;
}

/**
 * Simple in-memory conversation state service.
 * Stores pending actions for users so we can maintain context between messages.
 * 
 * In production, this should be backed by Redis for persistence and scaling.
 */
@Injectable()
export class ConversationStateService {
  private readonly logger = new Logger(ConversationStateService.name);
  private readonly pendingActions = new Map<string, PendingAction>();
  
  // Actions expire after 10 minutes
  private readonly TTL_MS = 10 * 60 * 1000;

  /**
   * Store a pending action for a user
   */
  setPendingAction(userIdentifier: string, action: PendingAction): void {
    this.logger.debug(`Setting pending action for ${userIdentifier}: ${JSON.stringify(action)}`);
    this.pendingActions.set(userIdentifier, {
      ...action,
      createdAt: new Date(),
    });
  }

  /**
   * Get and optionally clear the pending action for a user
   */
  getPendingAction(userIdentifier: string, clear = false): PendingAction | null {
    const action = this.pendingActions.get(userIdentifier);
    
    if (!action) {
      return null;
    }

    // Check if expired
    const ageMs = Date.now() - action.createdAt.getTime();
    if (ageMs > this.TTL_MS) {
      this.pendingActions.delete(userIdentifier);
      this.logger.debug(`Pending action for ${userIdentifier} expired`);
      return null;
    }

    if (clear) {
      this.pendingActions.delete(userIdentifier);
    }

    return action;
  }

  /**
   * Update the data of a pending action (e.g., when user provides amount)
   */
  updatePendingAction(userIdentifier: string, newData: Record<string, any>, removeField?: string): void {
    const action = this.getPendingAction(userIdentifier);
    if (!action) return;

    action.data = { ...action.data, ...newData };
    
    if (removeField && action.missing_fields.includes(removeField)) {
      action.missing_fields = action.missing_fields.filter(f => f !== removeField);
    }

    this.pendingActions.set(userIdentifier, action);
    this.logger.debug(`Updated pending action for ${userIdentifier}: ${JSON.stringify(action)}`);
  }

  /**
   * Clear pending action for a user
   */
  clearPendingAction(userIdentifier: string): void {
    this.pendingActions.delete(userIdentifier);
  }
}
