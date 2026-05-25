import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../shared/infrastructure/database/prisma.service';
import { User } from '../../../domain/aggregates/user.aggregate';
import { UserRepository } from '../../../domain/repositories/user.repository';
import { UserEmailAddress } from '../../../domain/value-objects/user-email-address';
import {
  PrismaUserMapper,
} from '../../mappers/prisma-user.mapper';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: UserEmailAddress): Promise<User | null> {
    const userRecord = await this.prisma.user.findUnique({
      where: {
        email: email.toString(),
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!userRecord) {
      return null;
    }

    return PrismaUserMapper.toDomain({
      id: userRecord.id,
      email: userRecord.email,
      passwordHash: userRecord.passwordHash,
      roles: userRecord.roles.map((assignment) => assignment.role.name),
      isActive: userRecord.isActive,
      isSystem: userRecord.isSystem,
      createdAt: userRecord.createdAt,
      updatedAt: userRecord.updatedAt,
    });
  }

  async findById(userId: string): Promise<User | null> {
    const userRecord = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!userRecord) {
      return null;
    }

    return PrismaUserMapper.toDomain({
      id: userRecord.id,
      email: userRecord.email,
      passwordHash: userRecord.passwordHash,
      roles: userRecord.roles.map((assignment) => assignment.role.name),
      isActive: userRecord.isActive,
      isSystem: userRecord.isSystem,
      createdAt: userRecord.createdAt,
      updatedAt: userRecord.updatedAt,
    });
  }

  async save(user: User): Promise<void> {
    const record = PrismaUserMapper.toPersistence(user);

    await this.prisma.user.upsert({
      where: {
        id: record.id,
      },
      create: {
        id: record.id,
        email: record.email,
        passwordHash: record.passwordHash,
        isActive: record.isActive,
        isSystem: record.isSystem,
        roles: {
          create: record.roles.map((roleName) => ({
            role: {
              connectOrCreate: {
                where: {
                  name: roleName,
                },
                create: {
                  name: roleName,
                },
              },
            },
          })),
        },
      },
      update: {
        email: record.email,
        passwordHash: record.passwordHash,
        isActive: record.isActive,
        isSystem: record.isSystem,
        roles: {
          deleteMany: {},
          create: record.roles.map((roleName) => ({
            role: {
              connectOrCreate: {
                where: {
                  name: roleName,
                },
                create: {
                  name: roleName,
                },
              },
            },
          })),
        },
      },
    });
  }
}
