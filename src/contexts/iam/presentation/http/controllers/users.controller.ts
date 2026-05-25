import {
  Body,
  ConflictException,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';
import {
  ApiConflictErrorResponse,
  ApiForbiddenErrorResponse,
  ApiUnauthorizedErrorResponse,
} from '../../../../../bootstrap/http/decorators/api-error-response-docs.decorator';
import { ApiCreateEndpointDocs } from '../../../../../bootstrap/http/decorators/api-endpoint-docs.decorator';
import { RequirePermissions } from '../../../../../shared/presentation/http/auth/require-permissions.decorator';
import {
  createSuccessResponse,
  type HttpSuccessResponse,
} from '../../../../../shared/presentation/http/response/http-response-envelope';
import { REGISTER_USER_USE_CASE } from '../../../application/tokens';
import { RegisterUserUseCase } from '../../../application/use-cases/register-user.use-case';
import { RegisterUserCommand } from '../../../application/commands/register-user.command';
import { RegisterUserBodyDto } from '../dto/register-user-body.dto';
import {
  RegisterUserHttpResponseDto,
  RegisterUserResponseDto,
} from '../dto/register-user-response.dto';
import { UserPresenter } from '../presenters/user.presenter';
import { IAM_USERS_CREATE_PERMISSION } from '../../../domain/constants/permission-name.constants';

@ApiTags('User')
@Controller('users')
export class UsersController {
  constructor(
    @Inject(REGISTER_USER_USE_CASE)
    private readonly registerUserUseCase: RegisterUserUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('access-token')
  @RequirePermissions(IAM_USERS_CREATE_PERMISSION)
  @ApiCreateEndpointDocs({
    summary: 'Create a user',
    description:
      'Creates a new IAM user through administrative onboarding with an email, password, and optional role assignments.',
    badRequestDescription: 'The request payload failed validation.',
    successDescription: 'The user was created successfully.',
    responseType: RegisterUserHttpResponseDto,
    additionalResponses: [
      ApiConflictErrorResponse('A user with the same email already exists.'),
    ],
  })
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse(
    'The authenticated user is missing iam.users.create.',
  )
  async registerUser(
    @Body() body: RegisterUserBodyDto,
  ): Promise<HttpSuccessResponse<RegisterUserResponseDto>> {
    const result = await this.registerUserUseCase.execute(
      new RegisterUserCommand(body.email, body.password, body.roles),
    );

    if (!result.ok) {
      throw new ConflictException(result.error);
    }

    return createSuccessResponse(UserPresenter.toRegisterResponse(result.value));
  }
}
