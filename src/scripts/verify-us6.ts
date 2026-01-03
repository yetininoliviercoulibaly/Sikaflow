import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ResolveContextUseCase } from '../organization/application/use-cases/resolve-context.use-case';
import { I_USER_REPOSITORY } from '../user/domain/ports/user.repository.interface';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../user/domain/user.entity';
import { NotFoundException } from '@nestjs/common';

async function verify() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const resolveContext = app.get(ResolveContextUseCase);
  const userRepo = app.get(I_USER_REPOSITORY);

  console.log('--- US.6 VERIFICATION: REJECT UNKNOWN USERS ---');

  // 1. Test: Unknown Phone Number
  const unknownPhone = '+0000000000';
  console.log(`\n1. Testing Unknown Phone: ${unknownPhone}`);
  try {
    await resolveContext.execute({ phoneNumber: unknownPhone });
    throw new Error('❌ Failed: Should have rejected unknown user.');
  } catch (error) {
    if (error instanceof NotFoundException || error.status === 404) {
      console.log('✅ Success: Rejected with 404/NotFound.');
    } else {
      console.error('❌ Failed: Wrong error type:', error);
    }
  }

  // 2. Test: User exists but has NO Organization
  const noOrgPhone = `+555${Math.floor(Math.random() * 100000)}_NOORG`;
  await userRepo.create(new User(uuidv4(), noOrgPhone, 'Loner User', null, new Date()));
  console.log(`\n2. Testing Known User / No Org: ${noOrgPhone}`);
  
  try {
    await resolveContext.execute({ phoneNumber: noOrgPhone });
    throw new Error('❌ Failed: Should have rejected user with no org.');
  } catch (error) {
     // Expecting NotFoundException("User ... belongs to no organizations")
    if (error instanceof NotFoundException || error.status === 404) {
      console.log('✅ Success: Rejected with 404/NotFound.');
    } else {
      console.error('❌ Failed: Wrong error type:', error);
    }
  }

  console.log('\n--- VERIFICATION COMPLETE ---');
  await app.close();
}

verify().catch(console.error);
