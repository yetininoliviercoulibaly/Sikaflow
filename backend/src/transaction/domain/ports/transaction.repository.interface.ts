import { Transaction } from '../transaction.entity';

export const I_TRANSACTION_REPOSITORY = 'I_TRANSACTION_REPOSITORY';

export interface FindByOrganizationOptions {
  limit?: number;
  offset?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface ITransactionRepository {
  findById(id: string): Promise<Transaction | null>;
  create(transaction: Transaction): Promise<Transaction>;
  findByOrganization(organizationId: string, options?: FindByOrganizationOptions): Promise<Transaction[]>;
  findLatestByUser(userId: string, organizationId: string): Promise<Transaction | null>;
  delete(id: string): Promise<void>;
}
