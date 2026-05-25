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
import { ApiTags } from '@nestjs/swagger';
import {
  ApiNotFoundErrorResponse,
} from '../../../../../bootstrap/http/decorators/api-error-response-docs.decorator';
import {
  ApiCreateEndpointDocs,
  ApiDeleteEndpointDocs,
  ApiListEndpointDocs,
  ApiReadEndpointDocs,
  ApiUpdateEndpointDocs,
} from '../../../../../bootstrap/http/decorators/api-endpoint-docs.decorator';
import { Public } from '../../../../../shared/presentation/http/auth/public.decorator';
import {
  createSuccessResponse,
  type HttpSuccessResponse,
} from '../../../../../shared/presentation/http/response/http-response-envelope';
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
import { UpdateTodoBodyDto } from '../dto/update-todo-body.dto';
import { UserTodoOwnerParamsDto } from '../dto/user-todo-owner-params.dto';
import { UserTodoRouteParamsDto } from '../dto/user-todo-route-params.dto';
import { TodoPresenter } from '../presenters/todo.presenter';

@Public()
@ApiTags('Todo (By User ID)')
@Controller('users/:userId/todos')
export class UserTodosController {
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
  @ApiCreateEndpointDocs({
    summary: 'Create a todo item by user ID',
    description: 'Creates a todo item for the user identified directly in the route without using a Bearer token.',
    badRequestDescription: 'The route parameters or request payload failed validation.',
    successDescription: 'The todo item was created successfully.',
    responseType: TodoHttpResponseDto,
  })
  async createTodo(
    @Param() params: UserTodoOwnerParamsDto,
    @Body() body: CreateTodoBodyDto,
  ): Promise<HttpSuccessResponse<TodoResponseDto>> {
    const result = await this.createTodoUseCase.execute(
      new CreateTodoCommand(
        params.userId,
        body.title,
        body.description,
        body.dueDate,
      ),
    );

    return createSuccessResponse(TodoPresenter.toTodoResponse(result));
  }

  @Get()
  @ApiListEndpointDocs({
    summary: 'List todo items by user ID',
    description:
      'Returns a paginated list of todo items owned by the user identified directly in the route without using a Bearer token. Optional query filters can narrow the result set.',
    badRequestDescription:
      'The route parameters or query parameters failed validation.',
    successDescription: 'Todo items owned by the specified user.',
    responseType: ListUserTodosHttpResponseDto,
  })
  @ApiTodoListQueryDocs()
  async listTodos(
    @Param() params: UserTodoOwnerParamsDto,
    @Query() query: ListTodosQueryDto,
  ): Promise<
    HttpSuccessResponse<ListUserTodosResponseDto, ReturnType<typeof TodoPresenter.toTodoListPaginationMeta>>
  > {
    const result = await this.listUserTodosUseCase.execute(
      new ListUserTodosQuery(
        params.userId,
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
  @ApiReadEndpointDocs({
    summary: 'Read one todo item by user ID',
    description: 'Returns one todo item owned by the user identified directly in the route without using a Bearer token.',
    badRequestDescription: 'The route parameters failed validation.',
    successDescription: 'The todo item was returned successfully.',
    responseType: TodoHttpResponseDto,
  })
  @ApiNotFoundErrorResponse(
    'The requested todo item was not found for the specified user.',
  )
  async getTodo(
    @Param() params: UserTodoRouteParamsDto,
  ): Promise<HttpSuccessResponse<TodoResponseDto>> {
    const result = await this.getTodoUseCase.execute(
      new GetTodoQuery(params.userId, params.todoId),
    );

    if (!result.ok) {
      throw new NotFoundException(result.error);
    }

    return createSuccessResponse(TodoPresenter.toTodoResponse(result.value));
  }

  @Patch(':todoId')
  @ApiUpdateEndpointDocs({
    summary: 'Update one todo item by user ID',
    description: 'Partially updates one todo item owned by the user identified directly in the route without using a Bearer token.',
    badRequestDescription: 'The route parameters or request payload failed validation.',
    successDescription: 'The todo item was updated successfully.',
    responseType: TodoHttpResponseDto,
  })
  @ApiNotFoundErrorResponse(
    'The requested todo item was not found for the specified user.',
  )
  async updateTodo(
    @Param() params: UserTodoRouteParamsDto,
    @Body() body: UpdateTodoBodyDto,
  ): Promise<HttpSuccessResponse<TodoResponseDto>> {
    const result = await this.updateTodoUseCase.execute(
      new UpdateTodoCommand(
        params.userId,
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
  @ApiDeleteEndpointDocs({
    summary: 'Delete one todo item by user ID',
    description: 'Deletes one todo item owned by the user identified directly in the route without using a Bearer token.',
    badRequestDescription: 'The route parameters failed validation.',
    successDescription: 'The todo item was deleted successfully.',
  })
  @ApiNotFoundErrorResponse(
    'The requested todo item was not found for the specified user.',
  )
  async deleteTodo(@Param() params: UserTodoRouteParamsDto): Promise<void> {
    const result = await this.deleteTodoUseCase.execute(
      new DeleteTodoCommand(params.userId, params.todoId),
    );

    if (!result.ok) {
      throw new NotFoundException(result.error);
    }
  }
}
