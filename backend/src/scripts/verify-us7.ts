import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { CreateOrganizationUseCase } from '../organization/application/use-cases/create-organization.use-case';
import { AddMemberUseCase } from '../organization/application/use-cases/add-member.use-case';
import { SwitchOrganizationUseCase } from '../organization/application/use-cases/switch-organization.use-case';
import { IUserRepository, I_USER_REPOSITORY } from '../user/domain/ports/user.repository.interface';
import { UserRole } from '../organization/domain/organization-member.entity';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../user/domain/user.entity';

async function verifyUS7() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const createOrgUC = app.get(CreateOrganizationUseCase);
  const addMemberUC = app.get(AddMemberUseCase);
  const switchOrgUC = app.get(SwitchOrganizationUseCase);
  const userRepository = app.get<IUserRepository>(I_USER_REPOSITORY);

  try {
    console.log('--- STARTING US.7 VERIFICATION (Context Switch) ---');

    // 1. Setup User
    const phoneNumber = '+33700000007';
    let user = await userRepository.findByPhoneNumber(phoneNumber);
    if (!user) {
        user = new User(uuidv4(), phoneNumber, 'MultiSite Owner', null, new Date());
        await userRepository.create(user);
        console.log(`Created user: ${phoneNumber}`);
    }

    // 2. Setup Organizations
    const org1Name = `Club Paris ${uuidv4().substring(0, 4)}`;
    const org2Name = `Club Lyon ${uuidv4().substring(0, 4)}`;

    const org1 = await createOrgUC.execute({ name: org1Name, ownerId: user.id });
    console.log(`Created Org 1: ${org1.name} (${org1.id})`);
    
    // Auto-add owner check? As noted in review, createOrg might not add member. manually adding if needed.
    try {
        await addMemberUC.execute({ requesterId: user.id, organizationId: org1.id, targetPhoneNumber: phoneNumber, role: UserRole.OWNER });
    } catch (e) { /* ignore if already added or permission issue (if owner logic strict) */ }

    const org2 = await createOrgUC.execute({ name: org2Name, ownerId: user.id });
     console.log(`Created Org 2: ${org2.name} (${org2.id})`);
     try {
        await addMemberUC.execute({ requesterId: user.id, organizationId: org2.id, targetPhoneNumber: phoneNumber, role: UserRole.OWNER });
    } catch (e) {}

    const userFromRepo = await userRepository.findByPhoneNumber(phoneNumber);
    if (!userFromRepo) throw new Error('User not found');

    // 5. Switch to Org 1
    console.log(`\n➡️ Switching to "${org1Name}"...`);
    await switchOrgUC.execute({ userId: userFromRepo.id, targetOrganizationName: org1Name });
    
    // 6. Verify Context
    const userAfterSwitch = await userRepository.findById(userFromRepo.id);
    if (userAfterSwitch?.lastActiveOrganizationId !== org1.id) {
        throw new Error('❌ Failed to switch to Org 1');
    }
    console.log('✅ Context switched to Org 1');

    // 7. Switch to Org 2 (Fuzzy)
    console.log(`\n➡️ Switching to "lyon" (fuzzy match for ${org2Name})...`);
    const switchResult = await switchOrgUC.execute({ userId: userFromRepo.id, targetOrganizationName: 'lyon' });
    
    if (!switchResult.organization || switchResult.organization.id !== org2.id) {
        throw new Error('❌ Failed to fuzzy switch to Org 2');
    }
    console.log('✅ Context correctly switched to Org 2 (Fuzzy Match)');

    console.log('--- US.7 VERIFIED SUCCESSFULLY ---');

  } catch (error) {
    console.error('❌ VERIFICATION FAILED:', error);
  } finally {
    await app.close();
  }
}

verifyUS7();
