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
  NOTE_DELETE_ANY_PERMISSION,
  NOTE_READ_ANY_PERMISSION,
} from '../../../../iam/domain/constants/permission-name.constants';
import type { AuditedAdminDeleteUserNote } from '../../../application/audit/note-audit-descriptors';
import { DeleteNoteCommand } from '../../../application/commands/delete-note.command';
import { CreateNoteResult } from '../../../application/dto/create-note.result';
import { ListUserNotesResult } from '../../../application/dto/list-user-notes.result';
import { GetNoteQuery } from '../../../application/queries/get-note.query';
import { ListUserNotesQuery } from '../../../application/queries/list-user-notes.query';
import {
  ADMIN_DELETE_USER_NOTE_USE_CASE,
  ADMIN_GET_USER_NOTE_USE_CASE,
  ADMIN_LIST_USER_NOTES_USE_CASE,
} from '../../../application/tokens';
import { ApiNoteListQueryDocs } from '../decorators/api-note-list-query-docs.decorator';
import {
  AdminNoteOwnerRouteParamsDto,
  AdminUserNoteRouteParamsDto,
} from '../dto/admin-user-note-route-params.dto';
import { ListNotesQueryDto } from '../dto/list-notes-query.dto';
import {
  ListUserNotesHttpResponseDto,
  ListUserNotesResponseDto,
} from '../dto/list-user-notes-response.dto';
import { NoteHttpResponseDto, NoteResponseDto } from '../dto/note-response.dto';
import { NotePresenter } from '../presenters/note.presenter';

/**
 * Admin moderation of another user's notes: list, view, delete. There is
 * deliberately no update route.
 */
@ApiTags('Admin User Notes')
@ApiBearerAuth('access-token')
@Controller('admin/users/:userId/notes')
export class AdminUserNotesController {
  constructor(
    @Inject(ADMIN_LIST_USER_NOTES_USE_CASE)
    private readonly listUserNotes: UseCase<
      ListUserNotesQuery,
      Result<ListUserNotesResult, string>
    >,
    @Inject(ADMIN_GET_USER_NOTE_USE_CASE)
    private readonly getUserNote: UseCase<
      GetNoteQuery,
      Result<CreateNoteResult, string>
    >,
    @Inject(ADMIN_DELETE_USER_NOTE_USE_CASE)
    private readonly deleteUserNote: AuditedAdminDeleteUserNote,
  ) {}

  @Get()
  @RequirePermissions(NOTE_READ_ANY_PERMISSION)
  @ApiListEndpointDocs({
    summary: "List another user's notes",
    description:
      'Returns a paginated list of notes owned by the given user. Admin moderation route.',
    badRequestDescription:
      'The route or query parameters could not be processed.',
    successDescription: 'Note items owned by the given user.',
    responseType: ListUserNotesHttpResponseDto,
  })
  @ApiNoteListQueryDocs()
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse('The caller is missing note.read_any.')
  @ApiNotFoundErrorResponse('The requested user was not found.')
  async listNotes(
    @Param() params: AdminNoteOwnerRouteParamsDto,
    @Query() query: ListNotesQueryDto,
  ): Promise<
    HttpSuccessResponse<
      ListUserNotesResponseDto,
      ReturnType<typeof NotePresenter.toNoteListPaginationMeta>
    >
  > {
    const result = await this.listUserNotes.execute(
      new ListUserNotesQuery(
        params.userId,
        query.search,
        query.page,
        query.limit,
      ),
    );

    if (!result.ok) {
      throw new NotFoundException(result.error);
    }

    return createSuccessResponse(
      NotePresenter.toUserNoteListResponse(result.value),
      NotePresenter.toNoteListPaginationMeta(result.value),
    );
  }

  @Get(':noteId')
  @RequirePermissions(NOTE_READ_ANY_PERMISSION)
  @ApiReadEndpointDocs({
    summary: "Read one of another user's notes",
    description:
      'Returns one note owned by the given user. Admin moderation route.',
    badRequestDescription: 'The route parameters failed validation.',
    successDescription: 'The note was returned successfully.',
    responseType: NoteHttpResponseDto,
  })
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse('The caller is missing note.read_any.')
  @ApiNotFoundErrorResponse('The requested user or note was not found.')
  async getNote(
    @Param() params: AdminUserNoteRouteParamsDto,
  ): Promise<HttpSuccessResponse<NoteResponseDto>> {
    const result = await this.getUserNote.execute(
      new GetNoteQuery(params.userId, params.noteId),
    );

    if (!result.ok) {
      throw new NotFoundException(result.error);
    }

    return createSuccessResponse(NotePresenter.toNoteResponse(result.value));
  }

  @Delete(':noteId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(NOTE_DELETE_ANY_PERMISSION)
  @ApiDeleteEndpointDocs({
    summary: "Delete one of another user's notes",
    description:
      'Deletes one note owned by the given user and records the deletion in the audit log. Admin moderation route.',
    badRequestDescription: 'The route parameters failed validation.',
    successDescription: 'The note was deleted successfully.',
  })
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse('The caller is missing note.delete_any.')
  @ApiNotFoundErrorResponse('The requested user or note was not found.')
  async deleteNote(
    @Param() params: AdminUserNoteRouteParamsDto,
    @CurrentUser() currentUser: AuthenticatedUserContext,
  ): Promise<void> {
    const result = await this.deleteUserNote.execute(
      currentUser.userId,
      new DeleteNoteCommand(params.userId, params.noteId),
    );

    if (!result.ok) {
      throw new NotFoundException(result.error);
    }
  }
}
