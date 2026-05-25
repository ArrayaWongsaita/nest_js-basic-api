import { Injectable } from '@nestjs/common';
import { UniqueEntityId } from '../../../../../shared/domain/unique-entity-id';
import { PrismaService } from '../../../../../shared/infrastructure/database/prisma.service';
import { AuthSession } from '../../../domain/entities/auth-session.entity';
import { AuthSessionRepository } from '../../../domain/repositories/auth-session.repository';

@Injectable()
export class PrismaAuthSessionRepository implements AuthSessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByRefreshTokenHash(
    refreshTokenHash: string,
  ): Promise<AuthSession | null> {
    const session = await this.prisma.authSession.findUnique({
      where: {
        refreshTokenHash,
      },
    });

    if (!session) {
      return null;
    }

    return AuthSession.rehydrate(
      {
        userId: session.userId,
        refreshTokenHash: session.refreshTokenHash,
        expiresAt: session.expiresAt,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      },
      new UniqueEntityId(session.id),
    );
  }

  async save(session: AuthSession): Promise<void> {
    await this.prisma.authSession.upsert({
      where: {
        userId: session.userId,
      },
      create: {
        id: session.id.toString(),
        userId: session.userId,
        refreshTokenHash: session.refreshTokenHash,
        expiresAt: session.expiresAt,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      },
      update: {
        refreshTokenHash: session.refreshTokenHash,
        expiresAt: session.expiresAt,
        updatedAt: session.updatedAt,
      },
    });
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.prisma.authSession.deleteMany({
      where: {
        userId,
      },
    });
  }
}
