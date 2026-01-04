
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/core';
import { TicketClaim } from '../../domain/ticket-claim.entity';
import { TicketClaimSchema } from './ticket-claim.schema';
import { ITicketClaimRepository } from '../../domain/ports/ticket-claim.repository.interface';

@Injectable()
export class MikroOrmTicketClaimRepository implements ITicketClaimRepository {
  constructor(
    @InjectRepository(TicketClaimSchema)
    private readonly repository: EntityRepository<TicketClaim>,
  ) {}

  async save(claim: TicketClaim): Promise<void> {
    await this.repository.getEntityManager().persistAndFlush(claim);
  }

  async findByToken(token: string): Promise<TicketClaim | null> {
    return this.repository.findOne({ token });
  }

  async findByEventId(eventId: string): Promise<TicketClaim[]> {
    return this.repository.find({ eventId });
  }
}
