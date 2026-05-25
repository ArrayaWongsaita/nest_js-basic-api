import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiTags,
  ApiBearerAuth,
  ApiCookieAuth,
  ApiNoContentResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { ZodResponse } from 'nestjs-zod';
import {
  appendRefreshTokenCookie,
  clearRefreshTokenCookie,
  readCookie,
} from '../../../../../bootstrap/http/refresh-token-cookie';
import { APP_CONFIG } from '../../../../../bootstrap/config/app-config';
import type { AppConfig } from '../../../../../bootstrap/config/app-config';
import {
  ApiUnauthorizedErrorResponse,
} from '../../../../../bootstrap/http/decorators/api-error-response-docs.decorator';
import { Public } from '../../../../../shared/presentation/http/auth/public.decorator';
import { CurrentUser } from '../../../../../shared/presentation/http/auth/current-user.decorator';
import type { AuthenticatedUserContext } from '../../../../../shared/presentation/http/auth/authenticated-user.context';
import {
  createSuccessResponse,
  type HttpSuccessResponse,
} from '../../../../../shared/presentation/http/response/http-response-envelope';
import {
  AUTHENTICATE_USER_USE_CASE,
  GET_CURRENT_USER_USE_CASE,
  LOGOUT_AUTH_SESSION_USE_CASE,
  REFRESH_AUTH_SESSION_USE_CASE,
} from '../../../application/tokens';
import { AuthenticateUserCommand } from '../../../application/commands/authenticate-user.command';
import { GetCurrentUserQuery } from '../../../application/queries/get-current-user.query';
import { LogoutAuthSessionCommand } from '../../../application/commands/logout-auth-session.command';
import { RefreshAuthSessionCommand } from '../../../application/commands/refresh-auth-session.command';
import { AuthenticateUserUseCase } from '../../../application/use-cases/authenticate-user.use-case';
import { GetCurrentUserUseCase } from '../../../application/use-cases/get-current-user.use-case';
import { LogoutAuthSessionUseCase } from '../../../application/use-cases/logout-auth-session.use-case';
import { RefreshAuthSessionUseCase } from '../../../application/use-cases/refresh-auth-session.use-case';
import {
  AuthSessionHttpResponseDto,
  AuthSessionResponseDto,
} from '../dto/auth-session-response.dto';
import {
  CurrentUserHttpResponseDto,
  CurrentUserResponseDto,
} from '../dto/current-user-response.dto';
import { LoginBodyDto } from '../dto/login-body.dto';
import { AuthPresenter } from '../presenters/auth.presenter';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AUTHENTICATE_USER_USE_CASE)
    private readonly authenticateUserUseCase: AuthenticateUserUseCase,
    @Inject(REFRESH_AUTH_SESSION_USE_CASE)
    private readonly refreshAuthSessionUseCase: RefreshAuthSessionUseCase,
    @Inject(LOGOUT_AUTH_SESSION_USE_CASE)
    private readonly logoutAuthSessionUseCase: LogoutAuthSessionUseCase,
    @Inject(GET_CURRENT_USER_USE_CASE)
    private readonly getCurrentUserUseCase: GetCurrentUserUseCase,
    @Inject(APP_CONFIG)
    private readonly appConfig: AppConfig,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Authenticate a user',
    description:
      'Authenticates an IAM user and returns a Bearer access token while storing the refresh token in an HttpOnly cookie.',
  })
  @ZodResponse({
    status: HttpStatus.OK,
    description: 'The user was authenticated successfully.',
    type: AuthSessionHttpResponseDto,
  })
  @ApiUnauthorizedErrorResponse('The supplied email or password is invalid.')
  async login(
    @Body() body: LoginBodyDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<HttpSuccessResponse<AuthSessionResponseDto>> {
    const result = await this.authenticateUserUseCase.execute(
      new AuthenticateUserCommand(body.email, body.password),
    );

    if (!result.ok) {
      throw new UnauthorizedException(result.error);
    }

    appendRefreshTokenCookie(response, this.appConfig, result.value.refreshToken);

    return createSuccessResponse(
      AuthPresenter.toAuthSessionResponse(result.value.response),
    );
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('refresh-token')
  @ApiOperation({
    summary: 'Refresh an access token',
    description:
      'Rotates the active refresh session using the HttpOnly refresh-token cookie and returns a fresh Bearer access token.',
  })
  @ZodResponse({
    status: HttpStatus.OK,
    description: 'The access token was refreshed successfully.',
    type: AuthSessionHttpResponseDto,
  })
  @ApiUnauthorizedErrorResponse(
    'The refresh session is missing, invalid, or expired.',
  )
  async refresh(
    @Headers('cookie') cookieHeader: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ): Promise<HttpSuccessResponse<AuthSessionResponseDto>> {
    const refreshToken = readCookie(
      cookieHeader,
      this.appConfig.auth.refreshCookieName,
    );

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh session is missing.');
    }

    const result = await this.refreshAuthSessionUseCase.execute(
      new RefreshAuthSessionCommand(refreshToken),
    );

    if (!result.ok) {
      throw new UnauthorizedException(result.error);
    }

    appendRefreshTokenCookie(response, this.appConfig, result.value.refreshToken);

    return createSuccessResponse(
      AuthPresenter.toAuthSessionResponse(result.value.response),
    );
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiCookieAuth('refresh-token')
  @ApiOperation({
    summary: 'Logout a user session',
    description:
      'Revokes the active refresh session associated with the current refresh-token cookie and clears the cookie.',
  })
  @ApiNoContentResponse({
    description: 'The refresh session was cleared successfully.',
  })
  async logout(
    @Headers('cookie') cookieHeader: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const refreshToken = readCookie(
      cookieHeader,
      this.appConfig.auth.refreshCookieName,
    );

    await this.logoutAuthSessionUseCase.execute(
      new LogoutAuthSessionCommand(refreshToken),
    );
    clearRefreshTokenCookie(response, this.appConfig);
  }

  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Read the current user',
    description:
      'Returns the authenticated IAM user represented by the current access token.',
  })
  @ZodResponse({
    status: HttpStatus.OK,
    description: 'The authenticated user was returned successfully.',
    type: CurrentUserHttpResponseDto,
  })
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  async me(
    @CurrentUser() currentUser: AuthenticatedUserContext,
  ): Promise<HttpSuccessResponse<CurrentUserResponseDto>> {
    const result = await this.getCurrentUserUseCase.execute(
      new GetCurrentUserQuery(currentUser.userId),
    );

    if (!result.ok) {
      throw new UnauthorizedException(result.error);
    }

    return createSuccessResponse(
      AuthPresenter.toCurrentUserResponse(result.value),
    );
  }
}
