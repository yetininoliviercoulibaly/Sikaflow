export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export class Transaction {
  constructor(
    public id: string,
    public organizationId: string,
    public reportedByUserId: string | null,
    public originMessageId: string | null,
    public type: TransactionType,
    public amount: number,
    public currency: string,
    public category: string | null,
    public description: string | null,
    public transactionDate: Date,
    public createdAt: Date,
  ) {}
}
