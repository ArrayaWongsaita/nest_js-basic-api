import { UserAccessProfile } from '../dto/user-access-profile';

export interface UserAccessReader {
  findByEmail(email: string): Promise<UserAccessProfile | null>;
  findById(userId: string): Promise<UserAccessProfile | null>;
}
