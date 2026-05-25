import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  ACCESS_TOKEN_ISSUER,
} from '../../../../contexts/iam/application/tokens';
import type { AccessTokenIssuer } from '../../../../contexts/iam/application/ports/access-token-issuer.port';
import { AuthenticatedRequest } from './authenticated-request';
import { PUBLIC_ROUTE_KEY } from './public.decorator';
import { REQUIRED_PERMISSIONS_KEY } from './require-permissions.decorator';

@Injectable()
export class AccessTokenAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(ACCESS_TOKEN_ISSUER)
    private readonly accessTokenIssuer: AccessTokenIssuer,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublicRoute = this.reflector.getAllAndOverride<boolean>(
      PUBLIC_ROUTE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublicRoute) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const bearerToken = readBearerToken(request.header('authorization'));

    if (!bearerToken) {
      throw new UnauthorizedException('Access token is required.');
    }

    try {
      const claims = await this.accessTokenIssuer.verify(bearerToken);
      const requiredPermissions =
        this.reflector.getAllAndOverride<string[]>(REQUIRED_PERMISSIONS_KEY, [
          context.getHandler(),
          context.getClass(),
        ]) ?? [];

      if (
        requiredPermissions.some(
          (permission) => !claims.permissions.includes(permission),
        )
      ) {
        throw new ForbiddenException(
          'You do not have permission to access this resource.',
        );
      }

      request.user = {
        userId: claims.sub,
        email: claims.email,
        roles: claims.roles,
        permissions: claims.permissions,
      };

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      throw new UnauthorizedException('Access token is invalid or expired.');
    }
  }
}

function readBearerToken(authorizationHeader: string | undefined): string | null {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
}
