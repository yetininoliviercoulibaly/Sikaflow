import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { OrganizationController } from '../organization/application/controllers/organization.controller';
import { I_USER_REPOSITORY } from '../user/domain/ports/user.repository.interface';
import { User } from '../user/domain/user.entity';
import { v4 as uuidv4 } from 'uuid';
import { UserRole } from '../organization/domain/organization-member.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  // Get Repositories and Controllers
  const userRepo = app.get(I_USER_REPOSITORY);
  const orgController = app.get(OrganizationController);
  
  // Ensure DB Schema exists (Drop and Recreate)
  // const orm = app.get('MikroORM'); 
  // const generator = orm.getSchemaGenerator();
  // await generator.refreshDatabase();

  console.log('--- STARTING VERIFICATION US.1 & US.2 ---');

  // 1. Create a Test User (Owner)
  const ownerId = uuidv4();
  const ownerRef = new User(ownerId, '+33612345678', 'John Doe', null, new Date());
  await userRepo.create(ownerRef);
  console.log('✅ Created User (Owner):', ownerRef.id);

  // 2. Test US.1: Create Organization
  try {
    const org = await orgController.create({
      name: 'Test Club',
      ownerId: ownerRef.id,
    });
    console.log('✅ Created Organization:', org.id, org.name);
    
    // Check if owner is member
    // We don't have a direct method on controller to get members easily without Auth, 
    // but creation implies success. We could check DB directly if we wanted to be 100% sure via repo
    // But relying on no error is a good first step.
  } catch (error) {
    console.error('❌ Failed to Create Organization:', error);
    process.exit(1);
  }

  // 3. Test US.2: Add Member
  const newMemberPhone = '+33698765432';
  try {
      // Need ID of created org. Since I didn't save it in var above scope... wait.
      // Let's redo connection to get the org properly.
  } catch (e) {}
}

// Rewriting for better flow
async function verify() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userRepo = app.get(I_USER_REPOSITORY);
  const orgController = app.get(OrganizationController);

  console.log('--- 1. SETUP ---');
  const ownerId = uuidv4();
  const ownerPhone = '+15550101'; // Dummy
  const owner = new User(ownerId, ownerPhone, 'Owner User', null, new Date());
  await userRepo.create(owner);
  console.log(`User Created: ${owner.id} (${owner.phoneNumber})`);

  console.log('\n--- 2. EXECUTE US.1: CREATE ORGANIZATION ---');
  const orgName = 'My Awesome Club';
  const org = await orgController.create({
    name: orgName,
    ownerId: owner.id,
  });
  console.log(`Organization Created: ${org.id} (${org.name})`);
  console.log(`Owner ID matches: ${org.ownerId === owner.id}`);

  console.log('\n--- 3. EXECUTE US.2: ADD MEMBER ---');
  const memberPhone = '+15550202';
  await orgController.addMember(org.id, {
    requesterId: owner.id,
    targetPhoneNumber: memberPhone,
    role: UserRole.MANAGER,
  });
  console.log(`Member Added with phone: ${memberPhone}`);

  // Refetch user to check if Ghost User was created
  const memberUser = await userRepo.findByPhoneNumber(memberPhone);
  if (memberUser) {
      console.log(`✅ Ghost User Found: ${memberUser.id}`);
  } else {
      console.error('❌ Ghost User NOT Found');
  }

  console.log('\n--- VERIFICATION COMPLETE ---');
  await app.close();
}

verify().catch(err => {
    console.error('FATAL ERROR:', err);
    process.exit(1);
});
