import { Transaction } from '../transaction.entity';

export const I_TRANSACTION_REPOSITORY = 'I_TRANSACTION_REPOSITORY';

export interface ITransactionRepository {
  findById(id: string): Promise<Transaction | null>;
  create(transaction: Transaction): Promise<Transaction>;
  findByOrganization(organizationId: string): Promise<Transaction[]>;
  // Add other methods as needed
}
