import { RegisterUserResult } from '../../../application/dto/register-user.result';
import { RegisterUserResponseDto } from '../dto/register-user-response.dto';

export class UserPresenter {
  static toRegisterResponse(
    result: RegisterUserResult,
  ): RegisterUserResponseDto {
    return {
      userId: result.userId,
      email: result.email,
      roles: result.roles,
    };
  }
}
