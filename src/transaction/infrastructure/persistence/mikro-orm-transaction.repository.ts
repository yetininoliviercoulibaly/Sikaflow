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

  async findByOrganization(organizationId: string): Promise<Transaction[]> {
    return this.em.find(Transaction, { organizationId });
  }
}
