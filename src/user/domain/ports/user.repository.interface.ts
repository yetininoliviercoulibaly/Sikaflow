import { User } from '../user.entity';

export const I_USER_REPOSITORY = 'I_USER_REPOSITORY';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByPhoneNumber(phoneNumber: string): Promise<User | null>;
  create(user: User): Promise<User>;
  update(user: User): Promise<User>;
}
