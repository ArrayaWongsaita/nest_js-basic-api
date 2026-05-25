import { UniqueEntityId } from '../../../../shared/domain/unique-entity-id';
import { User } from '../../domain/aggregates/user.aggregate';
import { RoleName } from '../../domain/value-objects/role-name';
import { UserEmailAddress } from '../../domain/value-objects/user-email-address';

export interface PrismaUserRecord {
  id: string;
  email: string;
  passwordHash: string;
  roles: string[];
  isActive: boolean;
  isSystem: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export class PrismaUserMapper {
  static toPersistence(user: User): PrismaUserRecord {
    return {
      id: user.id.toString(),
      email: user.email.toString(),
      passwordHash: user.passwordHash,
      roles: user.roleNames.map((roleName) => roleName.toString()),
      isActive: user.isActive,
      isSystem: user.isSystem,
      createdAt: user.createdAt,
    };
  }

  static toDomain(record: PrismaUserRecord): User {
    return User.rehydrate(
      {
        email: UserEmailAddress.create(record.email),
        passwordHash: record.passwordHash,
        roles: record.roles.map((role) => RoleName.create(role)),
        isActive: record.isActive,
        isSystem: record.isSystem,
        createdAt: record.createdAt,
      },
      new UniqueEntityId(record.id),
    );
  }
}
