import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { TransactionController } from '../transaction/application/controllers/transaction.controller';
import { I_USER_REPOSITORY } from '../user/domain/ports/user.repository.interface';
import { CreateOrganizationUseCase } from '../organization/application/use-cases/create-organization.use-case';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../user/domain/user.entity';
import { TransactionType } from '../transaction/domain/transaction.entity';
import { I_TRANSACTION_REPOSITORY } from '../transaction/domain/ports/transaction.repository.interface';

async function verify() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const txController = app.get(TransactionController);
  const createOrg = app.get(CreateOrganizationUseCase);
  const userRepo = app.get(I_USER_REPOSITORY);
  const txRepo = app.get(I_TRANSACTION_REPOSITORY);

  console.log('--- US.5 VERIFICATION (UPDATED): RECORD TRANSACTION WITH USER LINK ---');

  // 1. Setup: User + Org 1
  const userPhone = `+555${Math.floor(Math.random() * 100000)}_TX`; // Unique phone
  const userId = uuidv4();
  await userRepo.create(new User(userId, userPhone, 'Spender', null, new Date()));
  const org1 = await createOrg.execute({ name: 'Expense Org 1', ownerId: userId });
  console.log(`Setup: User ${userPhone} linked to ${org1.name}`);

  // 2. Test: Record Transaction 1 (Expect Org 1 + User Link + Message ID)
  console.log('\n2. Recording Transaction (Lunch)...');
  const messageId = uuidv4();
  const tx1 = await txController.create({
      phoneNumber: userPhone,
      amount: 50.00,
      category: 'Food',
      description: 'Team Lunch',
      type: TransactionType.EXPENSE,
      originMessageId: messageId,
  });
  console.log(`Transaction Created: ${tx1.id} for Org: ${tx1.organizationId}`);
  
  // Verification Checks
  if (tx1.organizationId !== org1.id) throw new Error('Org Mismatch on TX 1');
  if (tx1.reportedByUserId !== userId) throw new Error(`User Mismatch on TX 1: Expected ${userId}, got ${tx1.reportedByUserId}`);
  if (tx1.originMessageId !== messageId) throw new Error(`Message ID Mismatch on TX 1: Expected ${messageId}, got ${tx1.originMessageId}`);

  // 5. Verify Persistence
  const storedTx = await txRepo.findById(tx1.id);
  if (!storedTx) throw new Error('Persistence Fail');
  if (storedTx.reportedByUserId !== userId) throw new Error('Persistence User Mismatch');
  if (storedTx.originMessageId !== messageId) throw new Error('Persistence Message ID Mismatch');

  console.log('\n✅ Verification Successful: Transactions persisted with Organization, User, and Message links.');

  await app.close();
}

verify().catch(console.error);
