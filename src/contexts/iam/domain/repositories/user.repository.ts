import { User } from '../aggregates/user.aggregate';
import { UserEmailAddress } from '../value-objects/user-email-address';

export interface UserRepository {
  findByEmail(email: UserEmailAddress): Promise<User | null>;
  findById(userId: string): Promise<User | null>;
  save(user: User): Promise<void>;
}
