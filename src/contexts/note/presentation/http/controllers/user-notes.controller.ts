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
import { UpdateNoteBodyDto } from '../dto/update-note-body.dto';
import { UserNoteOwnerParamsDto } from '../dto/user-note-owner-params.dto';
import { UserNoteRouteParamsDto } from '../dto/user-note-route-params.dto';
import { NotePresenter } from '../presenters/note.presenter';

@Public()
@ApiTags('Note (By User ID)')
@Controller('users/:userId/notes')
export class UserNotesController {
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
  @ApiCreateEndpointDocs({
    summary: 'Create a note by user ID',
    description: 'Creates a note for the user identified directly in the route without using a Bearer token.',
    badRequestDescription: 'The route parameters or request payload failed validation.',
    successDescription: 'The note was created successfully.',
    responseType: NoteHttpResponseDto,
  })
  async createNote(
    @Param() params: UserNoteOwnerParamsDto,
    @Body() body: CreateNoteBodyDto,
  ): Promise<HttpSuccessResponse<NoteResponseDto>> {
    const result = await this.createNoteUseCase.execute(
      new CreateNoteCommand(
        params.userId,
        body.title,
        body.content,
      ),
    );

    return createSuccessResponse(NotePresenter.toNoteResponse(result));
  }

  @Get()
  @ApiListEndpointDocs({
    summary: 'List notes by user ID',
    description:
      'Returns a paginated list of notes owned by the user identified directly in the route without using a Bearer token. Optional query filters can narrow the result set.',
    badRequestDescription:
      'The route parameters or query parameters failed validation.',
    successDescription: 'Notes owned by the specified user.',
    responseType: ListUserNotesHttpResponseDto,
  })
  @ApiNoteListQueryDocs()
  async listNotes(
    @Param() params: UserNoteOwnerParamsDto,
    @Query() query: ListNotesQueryDto,
  ): Promise<
    HttpSuccessResponse<ListUserNotesResponseDto, ReturnType<typeof NotePresenter.toNoteListPaginationMeta>>
  > {
    const result = await this.listUserNotesUseCase.execute(
      new ListUserNotesQuery(
        params.userId,
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
  @ApiReadEndpointDocs({
    summary: 'Read one note by user ID',
    description: 'Returns one note owned by the user identified directly in the route without using a Bearer token.',
    badRequestDescription: 'The route parameters failed validation.',
    successDescription: 'The note was returned successfully.',
    responseType: NoteHttpResponseDto,
  })
  @ApiNotFoundErrorResponse(
    'The requested note was not found for the specified user.',
  )
  async getNote(
    @Param() params: UserNoteRouteParamsDto,
  ): Promise<HttpSuccessResponse<NoteResponseDto>> {
    const result = await this.getNoteUseCase.execute(
      new GetNoteQuery(params.userId, params.noteId),
    );

    if (!result.ok) {
      throw new NotFoundException(result.error);
    }

    return createSuccessResponse(NotePresenter.toNoteResponse(result.value));
  }

  @Patch(':noteId')
  @ApiUpdateEndpointDocs({
    summary: 'Update one note by user ID',
    description: 'Partially updates one note owned by the user identified directly in the route without using a Bearer token.',
    badRequestDescription: 'The route parameters or request payload failed validation.',
    successDescription: 'The note was updated successfully.',
    responseType: NoteHttpResponseDto,
  })
  @ApiNotFoundErrorResponse(
    'The requested note was not found for the specified user.',
  )
  async updateNote(
    @Param() params: UserNoteRouteParamsDto,
    @Body() body: UpdateNoteBodyDto,
  ): Promise<HttpSuccessResponse<NoteResponseDto>> {
    const result = await this.updateNoteUseCase.execute(
      new UpdateNoteCommand(
        params.userId,
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
  @ApiDeleteEndpointDocs({
    summary: 'Delete one note by user ID',
    description: 'Deletes one note owned by the user identified directly in the route without using a Bearer token.',
    badRequestDescription: 'The route parameters failed validation.',
    successDescription: 'The note was deleted successfully.',
  })
  @ApiNotFoundErrorResponse(
    'The requested note was not found for the specified user.',
  )
  async deleteNote(@Param() params: UserNoteRouteParamsDto): Promise<void> {
    const result = await this.deleteNoteUseCase.execute(
      new DeleteNoteCommand(params.userId, params.noteId),
    );

    if (!result.ok) {
      throw new NotFoundException(result.error);
    }
  }
}
