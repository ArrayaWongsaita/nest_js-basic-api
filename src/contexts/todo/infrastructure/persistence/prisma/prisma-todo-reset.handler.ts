import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../shared/infrastructure/database/prisma.service';
import {
  ResetDomainResult,
  ResetExecutionContext,
  ResettableDomainHandler,
} from '../../../../iam/application/ports/resettable-domain-handler.port';

@Injectable()
export class PrismaTodoResetHandler implements ResettableDomainHandler {
  readonly domainName = 'todo';

  constructor(private readonly prisma: PrismaService) {}

  async reset(context: ResetExecutionContext): Promise<ResetDomainResult> {
    const result = await this.prisma.todo.deleteMany({
      where:
        context.scope === 'user' && context.targetUserId
          ? {
              userId: context.targetUserId,
            }
          : undefined,
    });

    return {
      domain: this.domainName,
      deletedRecords: result.count,
      preservedRecords: 0,
    };
  }
}
