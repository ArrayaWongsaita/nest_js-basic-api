import { Module } from '@nestjs/common';
import { DbModule } from '../../shared/infrastructure/database';
import {
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
import { UserNotesController } from './presentation/http/controllers/user-notes.controller';

@Module({
  imports: [DbModule],
  controllers: [AuthenticatedNotesController, UserNotesController],
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
  ],
})
export class NoteModule {}
