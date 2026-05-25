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
  NOTE_CREATE_OWN_PERMISSION,
  NOTE_DELETE_OWN_PERMISSION,
  NOTE_READ_OWN_PERMISSION,
  NOTE_UPDATE_OWN_PERMISSION,
} from '../../../../iam/domain/constants/permission-name.constants';
import { CreateNoteCommand } from '../../../application/commands/create-note.command';
import { DeleteNoteCommand } from '../../../application/commands/delete-note.command';
import { UpdateNoteCommand } from '../../../application/commands/update-note.command';
import { GetNoteQuery } from '../../../application/queries/get-note.query';
import { ListUserNotesQuery } from '../../../application/queries/list-user-notes.query';
import {
  CREATE_NOTE_USE_CASE,
  DELETE_NOTE_USE_CASE,
  GET_NOTE_USE_CASE,
  LIST_USER_NOTES_USE_CASE,
  UPDATE_NOTE_USE_CASE,
} from '../../../application/tokens';
import { CreateNoteUseCase } from '../../../application/use-cases/create-note.use-case';
import { DeleteNoteUseCase } from '../../../application/use-cases/delete-note.use-case';
import { GetNoteUseCase } from '../../../application/use-cases/get-note.use-case';
import { ListUserNotesUseCase } from '../../../application/use-cases/list-user-notes.use-case';
import { UpdateNoteUseCase } from '../../../application/use-cases/update-note.use-case';
import { ApiNoteListQueryDocs } from '../decorators/api-note-list-query-docs.decorator';
import { CreateNoteBodyDto } from '../dto/create-note-body.dto';
import {
  ListUserNotesHttpResponseDto,
  ListUserNotesResponseDto,
} from '../dto/list-user-notes-response.dto';
import { ListNotesQueryDto } from '../dto/list-notes-query.dto';
import {
  NoteHttpResponseDto,
  NoteResponseDto,
} from '../dto/note-response.dto';
import { NoteRouteParamsDto } from '../dto/note-route-params.dto';
import { UpdateNoteBodyDto } from '../dto/update-note-body.dto';
import { NotePresenter } from '../presenters/note.presenter';

@ApiTags('Note (Authenticated)')
@ApiBearerAuth('access-token')
@Controller('notes')
export class AuthenticatedNotesController {
  constructor(
    @Inject(CREATE_NOTE_USE_CASE)
    private readonly createNoteUseCase: CreateNoteUseCase,
    @Inject(LIST_USER_NOTES_USE_CASE)
    private readonly listUserNotesUseCase: ListUserNotesUseCase,
    @Inject(GET_NOTE_USE_CASE)
    private readonly getNoteUseCase: GetNoteUseCase,
    @Inject(UPDATE_NOTE_USE_CASE)
    private readonly updateNoteUseCase: UpdateNoteUseCase,
    @Inject(DELETE_NOTE_USE_CASE)
    private readonly deleteNoteUseCase: DeleteNoteUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions(NOTE_CREATE_OWN_PERMISSION)
  @ApiCreateEndpointDocs({
    summary: 'Create a note for the authenticated user',
    description: 'Creates a note for the user represented by the current Bearer access token.',
    badRequestDescription: 'The request payload failed validation.',
    successDescription: 'The note was created successfully.',
    responseType: NoteHttpResponseDto,
  })
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse(
    'The authenticated user is missing note.create_own.',
  )
  async createNote(
    @Body() body: CreateNoteBodyDto,
    @CurrentUser() currentUser: AuthenticatedUserContext,
  ): Promise<HttpSuccessResponse<NoteResponseDto>> {
    const result = await this.createNoteUseCase.execute(
      new CreateNoteCommand(
        currentUser.userId,
        body.title,
        body.content,
      ),
    );

    return createSuccessResponse(NotePresenter.toNoteResponse(result));
  }

  @Get()
  @RequirePermissions(NOTE_READ_OWN_PERMISSION)
  @ApiListEndpointDocs({
    summary: 'List notes for the authenticated user',
    description:
      'Returns a paginated list of notes owned by the user represented by the current Bearer access token. Optional query filters can narrow the result set.',
    badRequestDescription:
      'The request query parameters could not be processed.',
    successDescription: 'Notes owned by the authenticated user.',
    responseType: ListUserNotesHttpResponseDto,
  })
  @ApiNoteListQueryDocs()
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse(
    'The authenticated user is missing note.read_own.',
  )
  async listNotes(
    @Query() query: ListNotesQueryDto,
    @CurrentUser() currentUser: AuthenticatedUserContext,
  ): Promise<
    HttpSuccessResponse<ListUserNotesResponseDto, ReturnType<typeof NotePresenter.toNoteListPaginationMeta>>
  > {
    const result = await this.listUserNotesUseCase.execute(
      new ListUserNotesQuery(
        currentUser.userId,
        query.search,
        query.page,
        query.limit,
      ),
    );

    return createSuccessResponse(
      NotePresenter.toUserNoteListResponse(result),
      NotePresenter.toNoteListPaginationMeta(result),
    );
  }

  @Get(':noteId')
  @RequirePermissions(NOTE_READ_OWN_PERMISSION)
  @ApiReadEndpointDocs({
    summary: 'Read one note for the authenticated user',
    description: 'Returns one note owned by the user represented by the current Bearer access token.',
    badRequestDescription: 'The route parameters failed validation.',
    successDescription: 'The note was returned successfully.',
    responseType: NoteHttpResponseDto,
  })
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse(
    'The authenticated user is missing note.read_own.',
  )
  @ApiNotFoundErrorResponse('The requested note was not found.')
  async getNote(
    @Param() params: NoteRouteParamsDto,
    @CurrentUser() currentUser: AuthenticatedUserContext,
  ): Promise<HttpSuccessResponse<NoteResponseDto>> {
    const result = await this.getNoteUseCase.execute(
      new GetNoteQuery(currentUser.userId, params.noteId),
    );

    if (!result.ok) {
      throw new NotFoundException(result.error);
    }

    return createSuccessResponse(NotePresenter.toNoteResponse(result.value));
  }

  @Patch(':noteId')
  @RequirePermissions(NOTE_UPDATE_OWN_PERMISSION)
  @ApiUpdateEndpointDocs({
    summary: 'Update one note for the authenticated user',
    description: 'Partially updates one note owned by the user represented by the current Bearer access token.',
    badRequestDescription: 'The route parameters or request payload failed validation.',
    successDescription: 'The note was updated successfully.',
    responseType: NoteHttpResponseDto,
  })
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse(
    'The authenticated user is missing note.update_own.',
  )
  @ApiNotFoundErrorResponse('The requested note was not found.')
  async updateNote(
    @Param() params: NoteRouteParamsDto,
    @Body() body: UpdateNoteBodyDto,
    @CurrentUser() currentUser: AuthenticatedUserContext,
  ): Promise<HttpSuccessResponse<NoteResponseDto>> {
    const result = await this.updateNoteUseCase.execute(
      new UpdateNoteCommand(
        currentUser.userId,
        params.noteId,
        body.title,
        body.content,
      ),
    );

    if (!result.ok) {
      throw new NotFoundException(result.error);
    }

    return createSuccessResponse(NotePresenter.toNoteResponse(result.value));
  }

  @Delete(':noteId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(NOTE_DELETE_OWN_PERMISSION)
  @ApiDeleteEndpointDocs({
    summary: 'Delete one note for the authenticated user',
    description: 'Deletes one note owned by the user represented by the current Bearer access token.',
    badRequestDescription: 'The route parameters failed validation.',
    successDescription: 'The note was deleted successfully.',
  })
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse(
    'The authenticated user is missing note.delete_own.',
  )
  @ApiNotFoundErrorResponse('The requested note was not found.')
  async deleteNote(
    @Param() params: NoteRouteParamsDto,
    @CurrentUser() currentUser: AuthenticatedUserContext,
  ): Promise<void> {
    const result = await this.deleteNoteUseCase.execute(
      new DeleteNoteCommand(currentUser.userId, params.noteId),
    );

    if (!result.ok) {
      throw new NotFoundException(result.error);
    }
  }
}
