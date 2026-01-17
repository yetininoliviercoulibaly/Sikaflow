import { MikroORM, IDatabaseDriver, Connection } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import config from '../../mikro-orm.config';
import { Transaction, TransactionType } from '../domain/transaction.entity';
import { v4 as uuidv4 } from 'uuid';

describe('Transaction Telegram Integration (Schema Check)', () => {
  let orm: MikroORM<PostgreSqlDriver>;

  beforeAll(async () => {
    // Override config to ensure we are testing against the running environment
    orm = await MikroORM.init({
      ...config,
      allowGlobalContext: true,
      debug: false,
    });
  });

  afterAll(async () => {
    await orm.close();
  });

  it('should allow creating a transaction with a non-UUID originMessageId (Telegram ID)', async () => {
    const em = orm.em.fork();

    const transactionId = uuidv4();
    const organizationId = uuidv4(); // Assuming no FK constraint for this test or using existing if fails
    const telegramMessageId = '123456789'; // INT as String, typical Telegram ID

    const transaction = new Transaction(
      transactionId,
      organizationId,
      null, // reportedByUserId
      telegramMessageId, // <--- THE TEST CASE
      TransactionType.EXPENSE,
      10.50,
      'EUR',
      'Test Category',
      'Test Description from Integration Spec',
      new Date(),
      new Date()
    );

    try {
      await em.persistAndFlush(transaction);
      
      // Verification
      const saved = await em.findOne(Transaction, { id: transactionId });
      expect(saved).toBeDefined();
      expect(saved?.originMessageId).toBe(telegramMessageId);
      
      // Cleanup
      await em.removeAndFlush(saved!);
    } catch (error) {
       console.error('Integration Test Failed:', error);
       throw error;
    }
  });

  it('should allow creating a transaction with a UUID originMessageId (WhatsApp ID)', async () => {
    const em = orm.em.fork();

    const transactionId = uuidv4();
    const organizationId = uuidv4();
    const whatsAppMessageId = uuidv4(); // UUID

    const transaction = new Transaction(
      transactionId,
      organizationId,
      null,
      whatsAppMessageId, 
      TransactionType.EXPENSE,
      20.00,
      'USD',
      'WhatsApp Test',
      'Description',
      new Date(),
      new Date()
    );

    await em.persistAndFlush(transaction);
    
     // Verification
     const saved = await em.findOne(Transaction, { id: transactionId });
     expect(saved).toBeDefined();
     expect(saved?.originMessageId).toBe(whatsAppMessageId);
     
     // Cleanup
     await em.removeAndFlush(saved!);
  });
});
