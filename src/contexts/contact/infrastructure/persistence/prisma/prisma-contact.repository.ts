import { Injectable } from '@nestjs/common';
import { UniqueEntityId } from '../../../../../shared/domain/unique-entity-id';
import { PrismaService } from '../../../../../shared/infrastructure/database/prisma.service';
import { Contact } from '../../../domain/aggregates/contact.aggregate';
import {
  ContactListFilters,
  PaginatedContacts,
  ContactRepository,
} from '../../../domain/repositories/contact.repository';

@Injectable()
export class PrismaContactRepository implements ContactRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(contact: Contact): Promise<void> {
    await this.prisma.contact.upsert({
      where: {
        id: contact.id.toString(),
      },
      create: {
        id: contact.id.toString(),
        userId: contact.userId,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone,
        company: contact.company,
        address: contact.address,
        createdAt: contact.createdAt,
        updatedAt: contact.updatedAt,
      },
      update: {
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone,
        company: contact.company,
        address: contact.address,
        updatedAt: contact.updatedAt,
      },
    });
  }

  async findPageByUserId(
    userId: string,
    filters: ContactListFilters,
    page: number,
    limit: number,
  ): Promise<PaginatedContacts> {
    const where = createContactWhereClause(userId, filters);
    const skip = (page - 1) * limit;

    const [contactRecords, totalItems] = await Promise.all([
      this.prisma.contact.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.contact.count({
        where,
      }),
    ]);

    return {
      items: contactRecords.map(mapContactRecordToAggregate),
      totalItems,
    };
  }

  async findByIdAndUserId(
    contactId: string,
    userId: string,
  ): Promise<Contact | null> {
    const contactRecord = await this.prisma.contact.findFirst({
      where: {
        id: contactId,
        userId,
      },
    });

    return contactRecord ? mapContactRecordToAggregate(contactRecord) : null;
  }

  async deleteByIdAndUserId(
    contactId: string,
    userId: string,
  ): Promise<void> {
    await this.prisma.contact.deleteMany({
      where: {
        id: contactId,
        userId,
      },
    });
  }
}

function createContactWhereClause(
  userId: string,
  filters: ContactListFilters,
) {
  const trimmedSearch = filters.search?.trim();

  return {
    userId,
    ...(trimmedSearch
      ? {
          OR: [
            {
              firstName: {
                contains: trimmedSearch,
                mode: 'insensitive' as const,
              },
            },
            {
              lastName: {
                contains: trimmedSearch,
                mode: 'insensitive' as const,
              },
            },
            {
              email: {
                contains: trimmedSearch,
                mode: 'insensitive' as const,
              },
            },
            {
              phone: {
                contains: trimmedSearch,
                mode: 'insensitive' as const,
              },
            },
            {
              company: {
                contains: trimmedSearch,
                mode: 'insensitive' as const,
              },
            },
          ],
        }
      : {}),
  };
}

function mapContactRecordToAggregate(contactRecord: {
  id: string;
  userId: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  createdAt: Date;
  updatedAt: Date;
}): Contact {
  return Contact.rehydrate(
    {
      userId: contactRecord.userId,
      firstName: contactRecord.firstName,
      lastName: contactRecord.lastName,
      email: contactRecord.email,
      phone: contactRecord.phone,
      company: contactRecord.company,
      address: contactRecord.address,
      createdAt: contactRecord.createdAt,
      updatedAt: contactRecord.updatedAt,
    },
    new UniqueEntityId(contactRecord.id),
  );
}
