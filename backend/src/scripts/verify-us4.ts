import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { OrganizationController } from '../organization/application/controllers/organization.controller';
import { I_USER_REPOSITORY } from '../user/domain/ports/user.repository.interface';
import { I_ORGANIZATION_REPOSITORY } from '../organization/domain/ports/organization.repository.interface';
import { CreateOrganizationUseCase } from '../organization/application/use-cases/create-organization.use-case';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../user/domain/user.entity';
import { UserRole } from '../organization/domain/organization-member.entity';

async function verify() {
  const app = await NestFactory.createApplicationContext(AppModule);
  // Using pre-existing schema setup

  const orgController = app.get(OrganizationController);
  const createOrg = app.get(CreateOrganizationUseCase);
  const userRepo = app.get(I_USER_REPOSITORY);
  const orgRepo = app.get(I_ORGANIZATION_REPOSITORY);

  console.log('--- US.4 VERIFICATION: MEMBER DEPARTURE ---');

  // 1. Setup: Owner + Org + Staff Member
  const ownerId = uuidv4();
  await userRepo.create(new User(ownerId, '+555_OWNER', 'Owner', null, new Date()));
  const org = await createOrg.execute({ name: 'Departure Club', ownerId });
  
  const staffId = uuidv4();
  await userRepo.create(new User(staffId, '+555_STAFF', 'Staff', null, new Date()));
  await orgController.addMember(org.id, { requesterId: ownerId, targetPhoneNumber: '+555_STAFF', role: UserRole.STAFF });
  
  console.log('Setup Complete: Org created with Owner and Staff.');

  // 2. Test: Member Leaving (Self)
  console.log('\n2. Test: Staff Leaving (Self)...');
  try {
      await orgController.removeMember(org.id, staffId, staffId); // requester = target = staff
      const member = await orgRepo.findMember(org.id, staffId);
      if (!member) console.log('✅ Success: Staff left.');
      else console.error('❌ Fail: Staff still member.');
  } catch (e) {
      console.error('❌ Fail: Error during self-leave', e.message);
  }

  // Reload Staff
  await orgController.addMember(org.id, { requesterId: ownerId, targetPhoneNumber: '+555_STAFF', role: UserRole.STAFF });

  // 3. Test: Owner Revoking Staff
  console.log('\n3. Test: Owner Revoking Staff...');
  try {
      await orgController.removeMember(org.id, staffId, ownerId); // requester = owner
      const member = await orgRepo.findMember(org.id, staffId);
      if (!member) console.log('✅ Success: Owner revoked Staff.');
      else console.error('❌ Fail: Staff still member.');
  } catch (e) {
      console.error('❌ Fail: Error during revocation', e.message);
  }

  // 4. Test: Staff Revoking Owner (Should Fail)
  console.log('\n4. Test: Staff Revoking Owner (Security Check)...');
  await orgController.addMember(org.id, { requesterId: ownerId, targetPhoneNumber: '+555_STAFF', role: UserRole.STAFF });
  try {
      await orgController.removeMember(org.id, ownerId, staffId); // requester = staff, target = owner
      console.error('❌ Fail: Staff should not optionally revoke Owner!');
  } catch (e) {
      console.log('✅ Success: Staff blocked from revoking Owner.', e.message);
  }

  // 5. Test: Owner Leaving (Should Fail)
  console.log('\n5. Test: Owner Leaving (Business Rule)...');
  try {
      await orgController.removeMember(org.id, ownerId, ownerId);
      console.error('❌ Fail: Owner allowed to leave!');
  } catch (e) {
      console.log('✅ Success: Owner blocked from leaving.', e.message);
  }

  console.log('\n--- VERIFICATION COMPLETE ---');
  await app.close();
}

verify().catch(console.error);
