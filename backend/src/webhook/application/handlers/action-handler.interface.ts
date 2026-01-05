import { Injectable } from '@nestjs/common';
import { User } from '../../../user/domain/user.entity';

export interface ActionContext {
  organizationId: string | null;
  senderPhoneNumber: string;
  messageId: string;
  messageBody?: string;
  missingFields?: string[];
  language?: string;
  /** Pre-fetched user to avoid duplicate DB lookups in handlers */
  user?: User | null;
}

export interface IActionHandler {
  canHandle(intent: string): boolean;
  handle(data: Record<string, any>, context: ActionContext): Promise<void>;
}

export const ACTION_HANDLER_TOKEN = 'ACTION_HANDLER_TOKEN';
