import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../shared/infrastructure/database/prisma.service';
import { UserAccessProfile } from '../../../application/dto/user-access-profile';
import { UserAccessReader } from '../../../application/ports/user-access-reader.port';

@Injectable()
export class PrismaUserAccessReader implements UserAccessReader {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<UserAccessProfile | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: userAccessInclude,
    });

    return mapUserAccessProfile(user);
  }

  async findById(userId: string): Promise<UserAccessProfile | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: userAccessInclude,
    });

    return mapUserAccessProfile(user);
  }
}

const userAccessInclude = {
  roles: {
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  },
} as const;

function mapUserAccessProfile(
  user:
    | {
        id: string;
        email: string;
        passwordHash: string;
        isActive: boolean;
        isSystem: boolean;
        roles: Array<{
          role: {
            name: string;
            permissions: Array<{
              permission: {
                name: string;
              };
            }>;
          };
        }>;
      }
    | null,
): UserAccessProfile | null {
  if (!user) {
    return null;
  }

  const permissions = new Set<string>();

  for (const assignment of user.roles) {
    for (const grantedPermission of assignment.role.permissions) {
      permissions.add(grantedPermission.permission.name);
    }
  }

  return {
    userId: user.id,
    email: user.email,
    passwordHash: user.passwordHash,
    isActive: user.isActive,
    isSystem: user.isSystem,
    roles: user.roles.map((assignment) => assignment.role.name),
    permissions: [...permissions.values()],
  };
}
