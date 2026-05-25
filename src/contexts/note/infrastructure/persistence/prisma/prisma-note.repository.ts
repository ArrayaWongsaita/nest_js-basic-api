import { Injectable } from '@nestjs/common';
import { UniqueEntityId } from '../../../../../shared/domain/unique-entity-id';
import { PrismaService } from '../../../../../shared/infrastructure/database/prisma.service';
import { Note } from '../../../domain/aggregates/note.aggregate';
import {
  PaginatedNotes,
  NoteListFilters,
  NoteRepository,
} from '../../../domain/repositories/note.repository';

@Injectable()
export class PrismaNoteRepository implements NoteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(note: Note): Promise<void> {
    await this.prisma.note.upsert({
      where: {
        id: note.id.toString(),
      },
      create: {
        id: note.id.toString(),
        userId: note.userId,
        title: note.title,
        content: note.content,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      },
      update: {
        title: note.title,
        content: note.content,
        updatedAt: note.updatedAt,
      },
    });
  }

  async findPageByUserId(
    userId: string,
    filters: NoteListFilters,
    page: number,
    limit: number,
  ): Promise<PaginatedNotes> {
    const where = createNoteWhereClause(userId, filters);
    const skip = (page - 1) * limit;

    const [noteRecords, totalItems] = await Promise.all([
      this.prisma.note.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.note.count({
        where,
      }),
    ]);

    return {
      items: noteRecords.map(mapNoteRecordToAggregate),
      totalItems,
    };
  }

  async findByIdAndUserId(noteId: string, userId: string): Promise<Note | null> {
    const noteRecord = await this.prisma.note.findFirst({
      where: {
        id: noteId,
        userId,
      },
    });

    return noteRecord ? mapNoteRecordToAggregate(noteRecord) : null;
  }

  async deleteByIdAndUserId(noteId: string, userId: string): Promise<void> {
    await this.prisma.note.deleteMany({
      where: {
        id: noteId,
        userId,
      },
    });
  }
}

function createNoteWhereClause(userId: string, filters: NoteListFilters) {
  const trimmedSearch = filters.search?.trim();

  return {
    userId,
    ...(trimmedSearch
      ? {
          OR: [
            {
              title: {
                contains: trimmedSearch,
                mode: 'insensitive' as const,
              },
            },
            {
              content: {
                contains: trimmedSearch,
                mode: 'insensitive' as const,
              },
            },
          ],
        }
      : {}),
  };
}

function mapNoteRecordToAggregate(noteRecord: {
  id: string;
  userId: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}): Note {
  return Note.rehydrate(
    {
      userId: noteRecord.userId,
      title: noteRecord.title,
      content: noteRecord.content,
      createdAt: noteRecord.createdAt,
      updatedAt: noteRecord.updatedAt,
    },
    new UniqueEntityId(noteRecord.id),
  );
}
