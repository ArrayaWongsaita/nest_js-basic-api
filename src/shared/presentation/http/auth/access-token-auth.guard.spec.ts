import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ACCESS_TOKEN_ISSUER } from '../../../../contexts/iam/application/tokens';
import { AccessTokenAuthGuard } from './access-token-auth.guard';

function createExecutionContext(request: {
  header(name: string): string | undefined;
  user?: unknown;
}): ExecutionContext {
  return {
    getHandler: () => 'handler',
    getClass: () => 'class',
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;
}

describe('AccessTokenAuthGuard', () => {
  it('allows public routes without a bearer token', async () => {
    const reflector = {
      getAllAndOverride: jest
        .fn()
        .mockReturnValueOnce(true),
    } as unknown as Reflector;
    const guard = new AccessTokenAuthGuard(reflector, {
      verify: jest.fn(),
    });

    await expect(
      guard.canActivate(
        createExecutionContext({
          header: () => undefined,
        }),
      ),
    ).resolves.toBe(true);
  });

  it('denies routes when the required permission is missing', async () => {
    const reflector = {
      getAllAndOverride: jest
        .fn()
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(['iam.users.create']),
    } as unknown as Reflector;
    const guard = new AccessTokenAuthGuard(reflector, {
      verify: jest.fn().mockResolvedValue({
        sub: 'user-1',
        email: 'architect@example.com',
        roles: ['student'],
        permissions: ['todo.read_own'],
        iat: 1,
        exp: 2,
      }),
    });

    await expect(
      guard.canActivate(
        createExecutionContext({
          header: () => 'Bearer access-token',
        }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('attaches the authenticated user context when the token is valid', async () => {
    const reflector = {
      getAllAndOverride: jest
        .fn()
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(['todo.read_own']),
    } as unknown as Reflector;
    const request = {
      header: () => 'Bearer access-token',
      user: undefined,
    };
    const guard = new AccessTokenAuthGuard(reflector, {
      verify: jest.fn().mockResolvedValue({
        sub: 'user-1',
        email: 'architect@example.com',
        roles: ['student'],
        permissions: ['todo.read_own'],
        iat: 1,
        exp: 2,
      }),
    });

    await expect(
      guard.canActivate(createExecutionContext(request)),
    ).resolves.toBe(true);
    expect(request.user).toEqual({
      userId: 'user-1',
      email: 'architect@example.com',
      roles: ['student'],
      permissions: ['todo.read_own'],
    });
  });

  it('rejects malformed bearer tokens', async () => {
    const reflector = {
      getAllAndOverride: jest
        .fn()
        .mockReturnValueOnce(false)
        .mockReturnValueOnce([]),
    } as unknown as Reflector;
    const guard = new AccessTokenAuthGuard(reflector, {
      verify: jest.fn().mockRejectedValue(new Error('bad token')),
    });

    await expect(
      guard.canActivate(
        createExecutionContext({
          header: () => 'Bearer access-token',
        }),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
