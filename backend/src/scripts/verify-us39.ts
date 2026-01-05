
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { CreateOrganizationUseCase } from '../organization/application/use-cases/create-organization.use-case';
import { I_USER_REPOSITORY } from '../user/domain/ports/user.repository.interface';
import { I_ORGANIZATION_REPOSITORY } from '../organization/domain/ports/organization.repository.interface';

async function verifyFrictionlessOnboarding() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const createOrganizationUseCase = app.get(CreateOrganizationUseCase);
  const userRepo = app.get(I_USER_REPOSITORY);
  const orgRepo = app.get(I_ORGANIZATION_REPOSITORY);

  const randomPhone = '+1555' + Math.floor(Math.random() * 10000000).toString();
  const orgName = 'Frictionless Org ' + Math.random().toString(36).substring(7);

  console.log(`🧪 Verifying Frictionless Onboarding...`);
  console.log(`PARAMS: Phone=${randomPhone}, OrgName=${orgName}`);

  try {
    // Execute use case WITHOUT ownerId, only phone number
    const newOrg = await createOrganizationUseCase.execute({
      name: orgName,
      userPhoneNumber: randomPhone,
    });

    console.log(`✅ Organization created: ${newOrg.id} (${newOrg.name})`);

    // Verify User Creation
    const user = await userRepo.findByPhoneNumber(randomPhone);
    if (user) {
        console.log(`✅ User automatically created: ${user.id} (Phone: ${user.phoneNumber})`);
    } else {
        console.error(`❌ User was NOT created!`);
    }

    // Verify Member Link
    if (user) {
        const owner = await orgRepo.findMember(newOrg.id, user.id);
        if (owner && owner.role === 'OWNER') {
            console.log(`✅ User linked as OWNER of the organization.`);
        } else {
            console.error(`❌ User is NOT linked as OWNER!`);
        }
    }

  } catch (error) {
    console.error('❌ Verification Failed:', error);
  } finally {
    await app.close();
  }
}

verifyFrictionlessOnboarding();
