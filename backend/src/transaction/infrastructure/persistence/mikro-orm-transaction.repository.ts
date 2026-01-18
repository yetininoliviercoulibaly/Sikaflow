import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { Transaction } from '../../domain/transaction.entity';
import { ITransactionRepository } from '../../domain/ports/transaction.repository.interface';

@Injectable()
export class MikroOrmTransactionRepository implements ITransactionRepository {
  constructor(private readonly em: EntityManager) {}

  async findById(id: string): Promise<Transaction | null> {
    return this.em.findOne(Transaction, { id });
  }

  async create(transaction: Transaction): Promise<Transaction> {
    const newTx = this.em.create(Transaction, transaction);
    await this.em.persistAndFlush(newTx);
    return newTx;
  }

  async findByOrganization(
    organizationId: string,
    options?: { limit?: number; offset?: number; startDate?: Date; endDate?: Date }
  ): Promise<Transaction[]> {
    const { limit = 100, offset = 0, startDate, endDate } = options || {};
    
    const where: any = { organizationId };
    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) where.transactionDate.$gte = startDate;
      if (endDate) where.transactionDate.$lte = endDate;
    }
    
    return this.em.find(Transaction, where, { 
      limit, 
      offset,
      orderBy: { transactionDate: 'DESC' }
    });
  }

  async findLatestByUser(userId: string, organizationId: string): Promise<Transaction | null> {
    const transactions = await this.em.find(Transaction, {
      organizationId,
      reportedByUserId: userId,
    }, {
      limit: 1,
      orderBy: { createdAt: 'DESC' },
    });
    return transactions[0] || null;
  }

  async delete(id: string): Promise<void> {
    const transaction = await this.findById(id);
    if (transaction) {
      await this.em.removeAndFlush(transaction);
    }
  }
}
