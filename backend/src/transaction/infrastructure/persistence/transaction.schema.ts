import { EntitySchema } from '@mikro-orm/core';
import { Transaction, TransactionType, TransactionStatus } from '../../domain/transaction.entity';

export const TransactionSchema = new EntitySchema<Transaction>({
  class: Transaction,
  tableName: 'transaction',
  properties: {
    id: { type: 'uuid', primary: true },
    organizationId: { type: 'uuid' },
    reportedByUserId: { type: 'uuid', nullable: true },
    originMessageId: { type: 'varchar', length: 255, nullable: true },
    type: { type: 'enum', enum: true, items: () => TransactionType },
    amount: { type: 'decimal', precision: 15, scale: 2 },
    currency: { type: 'varchar', length: 3 },
    category: { type: 'varchar', length: 50, nullable: true },
    description: { type: 'text', nullable: true },
    transactionDate: { type: 'timestamp' },
    createdAt: { type: 'timestamp' },
    status: { type: 'enum', enum: true, items: () => TransactionStatus, default: TransactionStatus.COMPLETED },
    contactId: { type: 'uuid', nullable: true },
    dueDate: { type: 'timestamp', nullable: true },
    settledAt: { type: 'timestamp', nullable: true },
  },
});
