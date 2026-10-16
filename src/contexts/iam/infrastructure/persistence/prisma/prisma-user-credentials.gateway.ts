import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../shared/infrastructure/database/prisma.service';
import { UserCredentialsPort } from '../../../application/ports/user-credentials.port';

@Injectable()
export class PrismaUserCredentialsGateway implements UserCredentialsPort {
  constructor(private readonly prisma: PrismaService) {}

  async setPassword(
    userId: string,
    passwordHash: string,
    mustChangePassword: boolean,
  ): Promise<boolean> {
    const result = await this.prisma.user.updateMany({
      where: { id: userId },
      data: { passwordHash, mustChangePassword },
    });

    return result.count > 0;
  }
}
