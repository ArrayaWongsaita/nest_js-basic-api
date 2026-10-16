import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  ApiForbiddenErrorResponse,
  ApiNotFoundErrorResponse,
  ApiUnauthorizedErrorResponse,
} from '../../../../../bootstrap/http/decorators/api-error-response-docs.decorator';
import {
  ApiDeleteEndpointDocs,
  ApiListEndpointDocs,
  ApiReadEndpointDocs,
} from '../../../../../bootstrap/http/decorators/api-endpoint-docs.decorator';
import { CurrentUser } from '../../../../../shared/presentation/http/auth/current-user.decorator';
import type { AuthenticatedUserContext } from '../../../../../shared/presentation/http/auth/authenticated-user.context';
import { RequirePermissions } from '../../../../../shared/presentation/http/auth/require-permissions.decorator';
import {
  createSuccessResponse,
  type HttpSuccessResponse,
} from '../../../../../shared/presentation/http/response/http-response-envelope';
import type { Result } from '../../../../../shared/application/result';
import type { UseCase } from '../../../../../shared/application/use-case';
import {
  TODO_DELETE_ANY_PERMISSION,
  TODO_READ_ANY_PERMISSION,
} from '../../../../iam/domain/constants/permission-name.constants';
import type { AuditedAdminDeleteUserTodo } from '../../../application/audit/todo-audit-descriptors';
import { DeleteTodoCommand } from '../../../application/commands/delete-todo.command';
import { CreateTodoResult } from '../../../application/dto/create-todo.result';
import { ListUserTodosResult } from '../../../application/dto/list-user-todos.result';
import { GetTodoQuery } from '../../../application/queries/get-todo.query';
import { ListUserTodosQuery } from '../../../application/queries/list-user-todos.query';
import {
  ADMIN_DELETE_USER_TODO_USE_CASE,
  ADMIN_GET_USER_TODO_USE_CASE,
  ADMIN_LIST_USER_TODOS_USE_CASE,
} from '../../../application/tokens';
import { ApiTodoListQueryDocs } from '../decorators/api-todo-list-query-docs.decorator';
import {
  AdminTodoOwnerRouteParamsDto,
  AdminUserTodoRouteParamsDto,
} from '../dto/admin-user-todo-route-params.dto';
import { ListTodosQueryDto } from '../dto/list-todos-query.dto';
import {
  ListUserTodosHttpResponseDto,
  ListUserTodosResponseDto,
} from '../dto/list-user-todos-response.dto';
import { TodoHttpResponseDto, TodoResponseDto } from '../dto/todo-response.dto';
import { TodoPresenter } from '../presenters/todo.presenter';

/**
 * Admin moderation of another user's todos: list, view, delete. There is
 * deliberately no update route.
 */
@ApiTags('Admin User Todos')
@ApiBearerAuth('access-token')
@Controller('admin/users/:userId/todos')
export class AdminUserTodosController {
  constructor(
    @Inject(ADMIN_LIST_USER_TODOS_USE_CASE)
    private readonly listUserTodos: UseCase<
      ListUserTodosQuery,
      Result<ListUserTodosResult, string>
    >,
    @Inject(ADMIN_GET_USER_TODO_USE_CASE)
    private readonly getUserTodo: UseCase<
      GetTodoQuery,
      Result<CreateTodoResult, string>
    >,
    @Inject(ADMIN_DELETE_USER_TODO_USE_CASE)
    private readonly deleteUserTodo: AuditedAdminDeleteUserTodo,
  ) {}

  @Get()
  @RequirePermissions(TODO_READ_ANY_PERMISSION)
  @ApiListEndpointDocs({
    summary: "List another user's todo items",
    description:
      'Returns a paginated list of todo items owned by the given user. Admin moderation route.',
    badRequestDescription:
      'The route or query parameters could not be processed.',
    successDescription: 'Todo items owned by the given user.',
    responseType: ListUserTodosHttpResponseDto,
  })
  @ApiTodoListQueryDocs()
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse('The caller is missing todo.read_any.')
  @ApiNotFoundErrorResponse('The requested user was not found.')
  async listTodos(
    @Param() params: AdminTodoOwnerRouteParamsDto,
    @Query() query: ListTodosQueryDto,
  ): Promise<
    HttpSuccessResponse<
      ListUserTodosResponseDto,
      ReturnType<typeof TodoPresenter.toTodoListPaginationMeta>
    >
  > {
    const result = await this.listUserTodos.execute(
      new ListUserTodosQuery(
        params.userId,
        query.isCompleted,
        query.search,
        query.page,
        query.limit,
      ),
    );

    if (!result.ok) {
      throw new NotFoundException(result.error);
    }

    return createSuccessResponse(
      TodoPresenter.toUserTodoListResponse(result.value),
      TodoPresenter.toTodoListPaginationMeta(result.value),
    );
  }

  @Get(':todoId')
  @RequirePermissions(TODO_READ_ANY_PERMISSION)
  @ApiReadEndpointDocs({
    summary: "Read one of another user's todo items",
    description:
      'Returns one todo item owned by the given user. Admin moderation route.',
    badRequestDescription: 'The route parameters failed validation.',
    successDescription: 'The todo item was returned successfully.',
    responseType: TodoHttpResponseDto,
  })
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse('The caller is missing todo.read_any.')
  @ApiNotFoundErrorResponse('The requested user or todo item was not found.')
  async getTodo(
    @Param() params: AdminUserTodoRouteParamsDto,
  ): Promise<HttpSuccessResponse<TodoResponseDto>> {
    const result = await this.getUserTodo.execute(
      new GetTodoQuery(params.userId, params.todoId),
    );

    if (!result.ok) {
      throw new NotFoundException(result.error);
    }

    return createSuccessResponse(TodoPresenter.toTodoResponse(result.value));
  }

  @Delete(':todoId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(TODO_DELETE_ANY_PERMISSION)
  @ApiDeleteEndpointDocs({
    summary: "Delete one of another user's todo items",
    description:
      'Deletes one todo item owned by the given user and records the deletion in the audit log. Admin moderation route.',
    badRequestDescription: 'The route parameters failed validation.',
    successDescription: 'The todo item was deleted successfully.',
  })
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse('The caller is missing todo.delete_any.')
  @ApiNotFoundErrorResponse('The requested user or todo item was not found.')
  async deleteTodo(
    @Param() params: AdminUserTodoRouteParamsDto,
    @CurrentUser() currentUser: AuthenticatedUserContext,
  ): Promise<void> {
    const result = await this.deleteUserTodo.execute(
      currentUser.userId,
      new DeleteTodoCommand(params.userId, params.todoId),
    );

    if (!result.ok) {
      throw new NotFoundException(result.error);
    }
  }
}
