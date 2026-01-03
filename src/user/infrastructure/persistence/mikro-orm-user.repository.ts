import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { User } from '../../domain/user.entity';
import { IUserRepository } from '../../domain/ports/user.repository.interface';

@Injectable()
export class MikroOrmUserRepository implements IUserRepository {
  constructor(private readonly em: EntityManager) {}

  async findById(id: string): Promise<User | null> {
    return this.em.findOne(User, { id });
  }

  async findByPhoneNumber(phoneNumber: string): Promise<User | null> {
    return this.em.findOne(User, { phoneNumber });
  }

  async create(user: User): Promise<User> {
    const newUser = this.em.create(User, user);
    await this.em.persistAndFlush(newUser);
    return newUser;
  }

  async update(user: User): Promise<User> {
    // MikroORM tracks changes on managed entities, so often just flush is enough if the entity is attached.
    // If detached, we merge.
    const merged = this.em.assign(user, user); // Simplified merge/update strategy
    await this.em.flush();
    return merged;
  }
}
