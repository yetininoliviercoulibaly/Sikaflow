export interface AddDebtPayload {
  amount: string; // From string parsing usually
  contactName: string;
  contactPhone?: string;
  contactContext?: string;
  currency?: string;
}

export interface SettleDebtPayload {
  amount?: string;
  contactName?: string;
  contactShortId?: string;
}

export interface SendReminderPayload {
  contactName: string;
}
