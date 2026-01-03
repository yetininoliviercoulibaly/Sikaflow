import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { EventPass, PassStatus } from '../../domain/event-pass.entity';
import { IEventPassRepository } from '../../domain/ports/event-pass.repository.interface';

@Injectable()
export class MikroOrmEventPassRepository implements IEventPassRepository {
  constructor(private readonly em: EntityManager) {}

  async findActiveForOrganization(organizationId: string): Promise<EventPass | null> {
    const now = new Date();
    return this.em.findOne(EventPass, {
      organizationId,
      status: PassStatus.ACTIVE,
      validFrom: { $lte: now },
      validUntil: { $gte: now },
    });
  }

  async findById(id: string): Promise<EventPass | null> {
    return this.em.findOne(EventPass, { id });
  }

  async create(pass: EventPass): Promise<EventPass> {
    const newPass = this.em.create(EventPass, pass);
    await this.em.persistAndFlush(newPass);
    return newPass;
  }

  async updateStatus(id: string, status: PassStatus): Promise<void> {
    const pass = await this.em.findOne(EventPass, { id });
    if (pass) {
      pass.status = status;
      await this.em.flush();
    }
  }
}
