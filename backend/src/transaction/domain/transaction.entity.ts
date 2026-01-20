export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  DEBT = 'DEBT',     // Money owed TO the user
  CREDIT = 'CREDIT', // Money the user OWES
}

export enum TransactionStatus {
  COMPLETED = 'COMPLETED',
  PENDING = 'PENDING',
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
    public status: TransactionStatus = TransactionStatus.COMPLETED,
    public contactId: string | null = null,
    public dueDate: Date | null = null,
    public settledAt: Date | null = null,
  ) {}

  /**
   * Check if this transaction is a pending debt
   */
  isPendingDebt(): boolean {
    return (
      (this.type === TransactionType.DEBT || this.type === TransactionType.CREDIT) &&
      this.status === TransactionStatus.PENDING
    );
  }

  /**
   * Mark debt as settled
   */
  settle(): void {
    this.status = TransactionStatus.COMPLETED;
    this.settledAt = new Date();
  }
}
