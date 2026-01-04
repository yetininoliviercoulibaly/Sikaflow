
import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import config from '../mikro-orm.config';
import { TicketingModule } from '../ticketing/ticketing.module';
import { GenerateClaimLinkUseCase } from '../ticketing/application/use-cases/generate-claim-link.use-case';
import { ClaimTicketUseCase } from '../ticketing/application/use-cases/claim-ticket.use-case';
import { MikroORM, RequestContext, EntityManager } from '@mikro-orm/core';
import { I_EVENT_REPOSITORY, IEventRepository } from '../ticketing/domain/ports/event.repository.interface';
import { I_TICKET_CLAIM_REPOSITORY, ITicketClaimRepository } from '../ticketing/domain/ports/ticket-claim.repository.interface';
import { Event } from '../ticketing/domain/event.entity';
import { TicketClaimStatus } from '../ticketing/domain/ticket-claim.entity';
import { v4 as uuidv4 } from 'uuid';

async function bootstrap() {
  const moduleRef = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true }),
      MikroOrmModule.forRoot(config),
      TicketingModule,
    ],
  }).compile();

  const app = moduleRef.createNestApplication();
  await app.init();
  
  const em = app.get(EntityManager);

  await RequestContext.create(em, async () => {
    // 1. Setup Data
    const eventRepo = app.get<IEventRepository>(I_EVENT_REPOSITORY);
    const claimRepo = app.get<ITicketClaimRepository>(I_TICKET_CLAIM_REPOSITORY);
    const generateUseCase = app.get(GenerateClaimLinkUseCase);
    const claimUseCase = app.get(ClaimTicketUseCase);

    const orgId = uuidv4();
    const eventId = uuidv4();

    console.log("Creating Event...");
    const event = new Event(eventId, orgId, "Claim Party", new Date(), 50, 1000);
    await eventRepo.save(event);

    // 2. Generate Claims
    console.log("Generating 3 Claim Links...");
    const claims = await generateUseCase.execute(eventId, orgId, 3);
    console.log(`Generated ${claims.length} claims.`);
    claims.forEach(c => console.log(`Token: ${c.token}`));

    if (claims.length !== 3) throw new Error("Generation Failed");

    // 3. Claim One
    const tokenToClaim = claims[0].token;
    console.log(`Claiming Token: ${tokenToClaim}`);
    
    await claimUseCase.execute(tokenToClaim, "22501020304");
    console.log("Claim executed.");

    // 4. Verify
    const updatedClaim = await claimRepo.findByToken(tokenToClaim);
    console.log(`Claim Status: ${updatedClaim?.status} (Expected: CLAIMED)`);

    if (updatedClaim?.status !== TicketClaimStatus.CLAIMED) {
        throw new Error("Claim status mismatch");
    }

    const updatedEvent = await eventRepo.findById(eventId);
    console.log(`Event Sold: ${updatedEvent?.soldCount} (Expected: 3 RESERVED)`);
    // Note: GenerateClaimLink RESERVES the spots (increments soldCount).
    
    // 5. Try Double Claim
    console.log("Attempting Double Claim...");
    try {
        await claimUseCase.execute(tokenToClaim, "22501020304");
        console.error("❌ Double Claim Should FAIL");
    } catch (e) {
        console.log(`✅ Double Claim Failed as expected: ${e.message}`);
    }

    console.log("✅ VERIFICATION SUCCESS");
  });

  await app.close();
}

bootstrap();
