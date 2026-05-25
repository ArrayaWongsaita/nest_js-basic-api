import { AuthSessionResult } from '../../../application/dto/auth-session.result';
import { CurrentUserResult } from '../../../application/use-cases/get-current-user.use-case';
import { AuthSessionResponseDto } from '../dto/auth-session-response.dto';
import { CurrentUserResponseDto } from '../dto/current-user-response.dto';

export class AuthPresenter {
  static toAuthSessionResponse(
    result: AuthSessionResult,
  ): AuthSessionResponseDto {
    return {
      accessToken: result.accessToken,
      tokenType: result.tokenType,
      expiresInSeconds: result.expiresInSeconds,
      user: {
        userId: result.user.userId,
        email: result.user.email,
        roles: result.user.roles,
        permissions: result.user.permissions,
      },
    };
  }

  static toCurrentUserResponse(
    result: CurrentUserResult,
  ): CurrentUserResponseDto {
    return {
      userId: result.userId,
      email: result.email,
      roles: result.roles,
      permissions: result.permissions,
    };
  }
}
