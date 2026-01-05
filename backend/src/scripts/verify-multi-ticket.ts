
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { IssueTicketUseCase } from '../ticketing/application/use-cases/issue-ticket.use-case';
import { MikroOrmEventRepository } from '../ticketing/infrastructure/persistence/mikro-orm-event.repository';
import { Event } from '../ticketing/domain/event.entity';
import { v4 as uuidv4 } from 'uuid';
import { CreateEventUseCase } from '../ticketing/application/use-cases/create-event.use-case';
import { MikroORM, RequestContext, EntityManager } from '@mikro-orm/core';
import config from '../mikro-orm.config';
import { I_EVENT_REPOSITORY, IEventRepository } from '../ticketing/domain/ports/event.repository.interface';

async function bootstrap() {
  console.log("Entities in config:", config.entities);
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const em = app.get(EntityManager);

  await RequestContext.create(em, async () => {
    // 1. Create Data
    const orgId = uuidv4();
    const eventId = uuidv4();
    
    console.log("Creating Event...");
    // Simulate Event creation
    const eventRepo = app.get<IEventRepository>(I_EVENT_REPOSITORY);
    const event = new Event(
        eventId,
        orgId,
        "Multi-Ticket Party",
        new Date(),
        100, // Capacity
        5000
    );
    await eventRepo.save(event);
    
    console.log("Event Created. Sold: " + event.soldCount);

    // 2. Issue 4 Tickets
    const issueTicket = app.get(IssueTicketUseCase); // This might use the global EM if not using RequestContext? 
    // Actually IssueTicketUseCase uses @Transactional or manual EM usage.
    // If it uses injected EM, it will use the Context one if inside RequestContext.
    
    console.log("Issuing 4 tickets...");
    
    await issueTicket.execute(
        "2250700000000",
        eventId,
        20000,
        4
    );

    // 3. Verify
    const updatedEvent = await eventRepo.findById(eventId);
    console.log("Updated Sold Count: " + updatedEvent?.soldCount);
    
    if (updatedEvent?.soldCount === 4) {
        console.log("✅ SUCCESS: 4 Tickets issued.");
    } else {
        console.error("❌ FAILURE: Sold count mismatch.");
    }
  });

  await app.close();
}

bootstrap();
