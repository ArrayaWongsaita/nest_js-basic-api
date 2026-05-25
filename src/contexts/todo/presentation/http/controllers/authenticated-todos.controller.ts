import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';
import {
  ApiForbiddenErrorResponse,
  ApiNotFoundErrorResponse,
  ApiUnauthorizedErrorResponse,
} from '../../../../../bootstrap/http/decorators/api-error-response-docs.decorator';
import {
  ApiCreateEndpointDocs,
  ApiDeleteEndpointDocs,
  ApiListEndpointDocs,
  ApiReadEndpointDocs,
  ApiUpdateEndpointDocs,
} from '../../../../../bootstrap/http/decorators/api-endpoint-docs.decorator';
import { CurrentUser } from '../../../../../shared/presentation/http/auth/current-user.decorator';
import type { AuthenticatedUserContext } from '../../../../../shared/presentation/http/auth/authenticated-user.context';
import { RequirePermissions } from '../../../../../shared/presentation/http/auth/require-permissions.decorator';
import {
  createSuccessResponse,
  type HttpSuccessResponse,
} from '../../../../../shared/presentation/http/response/http-response-envelope';
import {
  TODO_CREATE_OWN_PERMISSION,
  TODO_DELETE_OWN_PERMISSION,
  TODO_READ_OWN_PERMISSION,
  TODO_UPDATE_OWN_PERMISSION,
} from '../../../../iam/domain/constants/permission-name.constants';
import { CreateTodoCommand } from '../../../application/commands/create-todo.command';
import { DeleteTodoCommand } from '../../../application/commands/delete-todo.command';
import { UpdateTodoCommand } from '../../../application/commands/update-todo.command';
import { GetTodoQuery } from '../../../application/queries/get-todo.query';
import { ListUserTodosQuery } from '../../../application/queries/list-user-todos.query';
import {
  CREATE_TODO_USE_CASE,
  DELETE_TODO_USE_CASE,
  GET_TODO_USE_CASE,
  LIST_USER_TODOS_USE_CASE,
  UPDATE_TODO_USE_CASE,
} from '../../../application/tokens';
import { CreateTodoUseCase } from '../../../application/use-cases/create-todo.use-case';
import { DeleteTodoUseCase } from '../../../application/use-cases/delete-todo.use-case';
import { GetTodoUseCase } from '../../../application/use-cases/get-todo.use-case';
import { ListUserTodosUseCase } from '../../../application/use-cases/list-user-todos.use-case';
import { UpdateTodoUseCase } from '../../../application/use-cases/update-todo.use-case';
import { ApiTodoListQueryDocs } from '../decorators/api-todo-list-query-docs.decorator';
import { CreateTodoBodyDto } from '../dto/create-todo-body.dto';
import {
  ListUserTodosHttpResponseDto,
  ListUserTodosResponseDto,
} from '../dto/list-user-todos-response.dto';
import { ListTodosQueryDto } from '../dto/list-todos-query.dto';
import {
  TodoHttpResponseDto,
  TodoResponseDto,
} from '../dto/todo-response.dto';
import { TodoRouteParamsDto } from '../dto/todo-route-params.dto';
import { UpdateTodoBodyDto } from '../dto/update-todo-body.dto';
import { TodoPresenter } from '../presenters/todo.presenter';

@ApiTags('Todo (Authenticated)')
@ApiBearerAuth('access-token')
@Controller('todos')
export class AuthenticatedTodosController {
  constructor(
    @Inject(CREATE_TODO_USE_CASE)
    private readonly createTodoUseCase: CreateTodoUseCase,
    @Inject(LIST_USER_TODOS_USE_CASE)
    private readonly listUserTodosUseCase: ListUserTodosUseCase,
    @Inject(GET_TODO_USE_CASE)
    private readonly getTodoUseCase: GetTodoUseCase,
    @Inject(UPDATE_TODO_USE_CASE)
    private readonly updateTodoUseCase: UpdateTodoUseCase,
    @Inject(DELETE_TODO_USE_CASE)
    private readonly deleteTodoUseCase: DeleteTodoUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions(TODO_CREATE_OWN_PERMISSION)
  @ApiCreateEndpointDocs({
    summary: 'Create a todo item for the authenticated user',
    description: 'Creates a todo item for the user represented by the current Bearer access token.',
    badRequestDescription: 'The request payload failed validation.',
    successDescription: 'The todo item was created successfully.',
    responseType: TodoHttpResponseDto,
  })
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse(
    'The authenticated user is missing todo.create_own.',
  )
  async createTodo(
    @Body() body: CreateTodoBodyDto,
    @CurrentUser() currentUser: AuthenticatedUserContext,
  ): Promise<HttpSuccessResponse<TodoResponseDto>> {
    const result = await this.createTodoUseCase.execute(
      new CreateTodoCommand(
        currentUser.userId,
        body.title,
        body.description,
        body.dueDate,
      ),
    );

    return createSuccessResponse(TodoPresenter.toTodoResponse(result));
  }

  @Get()
  @RequirePermissions(TODO_READ_OWN_PERMISSION)
  @ApiListEndpointDocs({
    summary: 'List todo items for the authenticated user',
    description:
      'Returns a paginated list of todo items owned by the user represented by the current Bearer access token. Optional query filters can narrow the result set.',
    badRequestDescription:
      'The request query parameters could not be processed.',
    successDescription: 'Todo items owned by the authenticated user.',
    responseType: ListUserTodosHttpResponseDto,
  })
  @ApiTodoListQueryDocs()
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse(
    'The authenticated user is missing todo.read_own.',
  )
  async listTodos(
    @Query() query: ListTodosQueryDto,
    @CurrentUser() currentUser: AuthenticatedUserContext,
  ): Promise<
    HttpSuccessResponse<ListUserTodosResponseDto, ReturnType<typeof TodoPresenter.toTodoListPaginationMeta>>
  > {
    const result = await this.listUserTodosUseCase.execute(
      new ListUserTodosQuery(
        currentUser.userId,
        query.isCompleted,
        query.search,
        query.page,
        query.limit,
      ),
    );

    return createSuccessResponse(
      TodoPresenter.toUserTodoListResponse(result),
      TodoPresenter.toTodoListPaginationMeta(result),
    );
  }

  @Get(':todoId')
  @RequirePermissions(TODO_READ_OWN_PERMISSION)
  @ApiReadEndpointDocs({
    summary: 'Read one todo item for the authenticated user',
    description: 'Returns one todo item owned by the user represented by the current Bearer access token.',
    badRequestDescription: 'The route parameters failed validation.',
    successDescription: 'The todo item was returned successfully.',
    responseType: TodoHttpResponseDto,
  })
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse(
    'The authenticated user is missing todo.read_own.',
  )
  @ApiNotFoundErrorResponse('The requested todo item was not found.')
  async getTodo(
    @Param() params: TodoRouteParamsDto,
    @CurrentUser() currentUser: AuthenticatedUserContext,
  ): Promise<HttpSuccessResponse<TodoResponseDto>> {
    const result = await this.getTodoUseCase.execute(
      new GetTodoQuery(currentUser.userId, params.todoId),
    );

    if (!result.ok) {
      throw new NotFoundException(result.error);
    }

    return createSuccessResponse(TodoPresenter.toTodoResponse(result.value));
  }

  @Patch(':todoId')
  @RequirePermissions(TODO_UPDATE_OWN_PERMISSION)
  @ApiUpdateEndpointDocs({
    summary: 'Update one todo item for the authenticated user',
    description: 'Partially updates one todo item owned by the user represented by the current Bearer access token.',
    badRequestDescription: 'The route parameters or request payload failed validation.',
    successDescription: 'The todo item was updated successfully.',
    responseType: TodoHttpResponseDto,
  })
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse(
    'The authenticated user is missing todo.update_own.',
  )
  @ApiNotFoundErrorResponse('The requested todo item was not found.')
  async updateTodo(
    @Param() params: TodoRouteParamsDto,
    @Body() body: UpdateTodoBodyDto,
    @CurrentUser() currentUser: AuthenticatedUserContext,
  ): Promise<HttpSuccessResponse<TodoResponseDto>> {
    const result = await this.updateTodoUseCase.execute(
      new UpdateTodoCommand(
        currentUser.userId,
        params.todoId,
        body.title,
        body.description,
        body.isCompleted,
        body.dueDate,
      ),
    );

    if (!result.ok) {
      throw new NotFoundException(result.error);
    }

    return createSuccessResponse(TodoPresenter.toTodoResponse(result.value));
  }

  @Delete(':todoId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(TODO_DELETE_OWN_PERMISSION)
  @ApiDeleteEndpointDocs({
    summary: 'Delete one todo item for the authenticated user',
    description: 'Deletes one todo item owned by the user represented by the current Bearer access token.',
    badRequestDescription: 'The route parameters failed validation.',
    successDescription: 'The todo item was deleted successfully.',
  })
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse(
    'The authenticated user is missing todo.delete_own.',
  )
  @ApiNotFoundErrorResponse('The requested todo item was not found.')
  async deleteTodo(
    @Param() params: TodoRouteParamsDto,
    @CurrentUser() currentUser: AuthenticatedUserContext,
  ): Promise<void> {
    const result = await this.deleteTodoUseCase.execute(
      new DeleteTodoCommand(currentUser.userId, params.todoId),
    );

    if (!result.ok) {
      throw new NotFoundException(result.error);
    }
  }
}
