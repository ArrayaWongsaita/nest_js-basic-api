import { Module } from '@nestjs/common';
import { DbModule } from '../../shared/infrastructure/database';
import { ForExistingUser } from '../../shared/application/for-existing-user';
import { USER_EXISTENCE } from '../../shared/application/tokens';
import type { UserExistencePort } from '../../shared/application/user-existence.port';
import { AuditedAction } from '../iam/application/audit/audited-action';
import type { AuditLogPort } from '../iam/application/ports/audit-log.port';
import { AUDIT_LOG } from '../iam/application/tokens';
import { IamModule } from '../iam/iam.module';
import { describeAdminNoteDeletion } from './application/audit/note-audit-descriptors';
import { ListUserNotesAsResultUseCase } from './application/use-cases/list-user-notes-as-result.use-case';
import { AdminUserNotesController } from './presentation/http/controllers/admin-user-notes.controller';
import {
  ADMIN_DELETE_USER_NOTE_USE_CASE,
  ADMIN_GET_USER_NOTE_USE_CASE,
  ADMIN_LIST_USER_NOTES_USE_CASE,
  CREATE_NOTE_USE_CASE,
  DELETE_NOTE_USE_CASE,
  GET_NOTE_USE_CASE,
  LIST_USER_NOTES_USE_CASE,
  NOTE_REPOSITORY,
  UPDATE_NOTE_USE_CASE,
} from './application/tokens';
import { CreateNoteUseCase } from './application/use-cases/create-note.use-case';
import { DeleteNoteUseCase } from './application/use-cases/delete-note.use-case';
import { GetNoteUseCase } from './application/use-cases/get-note.use-case';
import { ListUserNotesUseCase } from './application/use-cases/list-user-notes.use-case';
import { UpdateNoteUseCase } from './application/use-cases/update-note.use-case';
import { PrismaNoteRepository } from './infrastructure/persistence/prisma/prisma-note.repository';
import { AuthenticatedNotesController } from './presentation/http/controllers/authenticated-notes.controller';

@Module({
  imports: [DbModule, IamModule],
  controllers: [AuthenticatedNotesController, AdminUserNotesController],
  providers: [
    {
      provide: NOTE_REPOSITORY,
      useClass: PrismaNoteRepository,
    },
    {
      provide: CREATE_NOTE_USE_CASE,
      useFactory: (noteRepository: PrismaNoteRepository) =>
        new CreateNoteUseCase(noteRepository),
      inject: [NOTE_REPOSITORY],
    },
    {
      provide: LIST_USER_NOTES_USE_CASE,
      useFactory: (noteRepository: PrismaNoteRepository) =>
        new ListUserNotesUseCase(noteRepository),
      inject: [NOTE_REPOSITORY],
    },
    {
      provide: GET_NOTE_USE_CASE,
      useFactory: (noteRepository: PrismaNoteRepository) =>
        new GetNoteUseCase(noteRepository),
      inject: [NOTE_REPOSITORY],
    },
    {
      provide: UPDATE_NOTE_USE_CASE,
      useFactory: (noteRepository: PrismaNoteRepository) =>
        new UpdateNoteUseCase(noteRepository),
      inject: [NOTE_REPOSITORY],
    },
    {
      provide: DELETE_NOTE_USE_CASE,
      useFactory: (noteRepository: PrismaNoteRepository) =>
        new DeleteNoteUseCase(noteRepository),
      inject: [NOTE_REPOSITORY],
    },
    {
      provide: ADMIN_LIST_USER_NOTES_USE_CASE,
      useFactory: (
        noteRepository: PrismaNoteRepository,
        users: UserExistencePort,
      ) =>
        new ForExistingUser(
          new ListUserNotesAsResultUseCase(
            new ListUserNotesUseCase(noteRepository),
          ),
          users,
        ),
      inject: [NOTE_REPOSITORY, USER_EXISTENCE],
    },
    {
      provide: ADMIN_GET_USER_NOTE_USE_CASE,
      useFactory: (
        noteRepository: PrismaNoteRepository,
        users: UserExistencePort,
      ) => new ForExistingUser(new GetNoteUseCase(noteRepository), users),
      inject: [NOTE_REPOSITORY, USER_EXISTENCE],
    },
    {
      provide: ADMIN_DELETE_USER_NOTE_USE_CASE,
      useFactory: (
        noteRepository: PrismaNoteRepository,
        users: UserExistencePort,
        auditLog: AuditLogPort,
      ) =>
        new AuditedAction(
          new ForExistingUser(new DeleteNoteUseCase(noteRepository), users),
          auditLog,
          describeAdminNoteDeletion,
        ),
      inject: [NOTE_REPOSITORY, USER_EXISTENCE, AUDIT_LOG],
    },
  ],
})
export class NoteModule {}
