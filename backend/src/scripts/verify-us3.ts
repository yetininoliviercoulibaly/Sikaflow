import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ResolveContextUseCase } from '../organization/application/use-cases/resolve-context.use-case';
import { OrganizationController } from '../organization/application/controllers/organization.controller';
import { I_USER_REPOSITORY } from '../user/domain/ports/user.repository.interface';
import { CreateOrganizationUseCase } from '../organization/application/use-cases/create-organization.use-case';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../user/domain/user.entity';

async function verify() {
  const app = await NestFactory.createApplicationContext(AppModule);
  // Skipped manual schema generation as we rely on the previous state or manual setup

  const resolveContext = app.get(ResolveContextUseCase);
  const orgController = app.get(OrganizationController);
  const createOrg = app.get(CreateOrganizationUseCase);
  const userRepo = app.get(I_USER_REPOSITORY);

  console.log('--- US.3 VERIFICATION: CONTEXT RESOLUTION ---');

  // 1. Setup: Create User and Organization
  const userPhone = `+555${Math.floor(Math.random() * 100000)}`;
  const userId = uuidv4();
  await userRepo.create(new User(userId, userPhone, 'Context User', null, new Date()));
  console.log(`Created User: ${userPhone}`);

  const org1 = await createOrg.execute({ name: 'Club Alpha', ownerId: userId });
  console.log(`Created Org 1: ${org1.name} (ID: ${org1.id})`);
  
  // 2. Test: Resolve Context (Should be Org 1)
  let context = await resolveContext.execute({ phoneNumber: userPhone });
  console.log(`\nResolved Context 1: ${context.name} (${context.id})`);
  if (context.id !== org1.id) throw new Error('Context Mismatch 1');

  // 3. Setup: Create Org 2 and Switch
  const org2 = await createOrg.execute({ name: 'Club Beta', ownerId: userId });
  console.log(`\nCreated Org 2: ${org2.name} (ID: ${org2.id})`);
  // Note: createOrg logic updates lastActiveOrganizationId to the new one automatically (implied by typical "create and switch" UX, let's verify if my UseCase did that)
  
  // 4. Test: Resolve Context (Should be Org 2)
  context = await resolveContext.execute({ phoneNumber: userPhone });
  console.log(`Resolved Context 2: ${context.name} (${context.id})`);
  if (context.id !== org2.id) throw new Error('Context Mismatch 2');

  // 5. Manual Switch Verification (Simulation)
  // If we manually set lastActive to Org 1
  const user = await userRepo.findById(userId);
  if (user) {
      user.lastActiveOrganizationId = org1.id;
      await userRepo.update(user);
      console.log('\nManually switched user to Org 1');
  }

  context = await resolveContext.execute({ phoneNumber: userPhone });
  console.log(`Resolved Context 3: ${context.name} (${context.id})`);
  if (context.id !== org1.id) throw new Error('Context Mismatch 3');

  console.log('\n✅ US.3 VERIFIED SUCCESS');
  await app.close();
}

verify().catch(console.error);
