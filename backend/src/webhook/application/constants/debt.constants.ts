export const DebtIntents = {
  ADD_DEBT: 'ADD_DEBT',
  ADD_CREDIT: 'ADD_CREDIT',
  LIST_DEBTS: 'LIST_DEBTS',
  LIST_CREDITS: 'LIST_CREDITS',
  SETTLE_DEBT: 'SETTLE_DEBT',
  SEND_REMINDER: 'SEND_REMINDER',
} as const;

export type DebtIntent = keyof typeof DebtIntents;
