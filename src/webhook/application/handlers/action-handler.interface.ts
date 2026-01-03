import { Injectable } from '@nestjs/common';

export interface ActionContext {
  organizationId: string | null;
  senderPhoneNumber: string;
  messageId: string;
  missingFields?: string[];
}

export interface IActionHandler {
  canHandle(intent: string): boolean;
  handle(data: Record<string, any>, context: ActionContext): Promise<void>;
}

export const ACTION_HANDLER_TOKEN = 'ACTION_HANDLER_TOKEN';
