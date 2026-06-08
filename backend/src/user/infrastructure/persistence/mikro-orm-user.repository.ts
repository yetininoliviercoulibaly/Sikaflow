import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { User } from '../../domain/user.entity';
import { IUserRepository } from '../../domain/ports/user.repository.interface';
import { normalizePhoneNumber } from '../../../common/utils/phone-number.util';

@Injectable()
export class MikroOrmUserRepository implements IUserRepository {
  constructor(private readonly em: EntityManager) {}

  async findById(id: string): Promise<User | null> {
    return this.em.findOne(User, { id });
  }

  async findByPhoneNumber(phoneNumber: string): Promise<User | null> {
    // Normalize the phone number before querying to handle local formats
    const normalized = normalizePhoneNumber(phoneNumber) || phoneNumber;
    return this.em.findOne(User, { phoneNumber: normalized });
  }

  async findByTelegramUserId(telegramUserId: string): Promise<User | null> {
    return this.em.findOne(User, { telegramUserId });
  }

  async findByIdentifier(identifier: string): Promise<User | null> {
    const userByPhone = await this.findByPhoneNumber(identifier);
    if (userByPhone) return userByPhone;
    return this.findByTelegramUserId(identifier);
  }

  async findAll(): Promise<User[]> {
    return this.em.find(User, {});
  }

  async create(user: User): Promise<User> {
    const newUser = this.em.create(User, user);
    await this.em.persistAndFlush(newUser);
    return newUser;
  }

  async update(user: User): Promise<User> {
    // Since user is typically a managed entity in this context, we just need to flush.
    await this.em.flush();
    return user;
  }
}
