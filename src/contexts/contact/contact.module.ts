import { Module } from '@nestjs/common';
import { DbModule } from '../../shared/infrastructure/database';
import {
  CONTACT_REPOSITORY,
  CREATE_CONTACT_USE_CASE,
  DELETE_CONTACT_USE_CASE,
  GET_CONTACT_USE_CASE,
  LIST_USER_CONTACTS_USE_CASE,
  UPDATE_CONTACT_USE_CASE,
} from './application/tokens';
import { CreateContactUseCase } from './application/use-cases/create-contact.use-case';
import { DeleteContactUseCase } from './application/use-cases/delete-contact.use-case';
import { GetContactUseCase } from './application/use-cases/get-contact.use-case';
import { ListUserContactsUseCase } from './application/use-cases/list-user-contacts.use-case';
import { UpdateContactUseCase } from './application/use-cases/update-contact.use-case';
import { PrismaContactRepository } from './infrastructure/persistence/prisma/prisma-contact.repository';
import { AuthenticatedContactsController } from './presentation/http/controllers/authenticated-contacts.controller';
import { UserContactsController } from './presentation/http/controllers/user-contacts.controller';

@Module({
  imports: [DbModule],
  controllers: [AuthenticatedContactsController, UserContactsController],
  providers: [
    {
      provide: CONTACT_REPOSITORY,
      useClass: PrismaContactRepository,
    },
    {
      provide: CREATE_CONTACT_USE_CASE,
      useFactory: (contactRepository: PrismaContactRepository) =>
        new CreateContactUseCase(contactRepository),
      inject: [CONTACT_REPOSITORY],
    },
    {
      provide: LIST_USER_CONTACTS_USE_CASE,
      useFactory: (contactRepository: PrismaContactRepository) =>
        new ListUserContactsUseCase(contactRepository),
      inject: [CONTACT_REPOSITORY],
    },
    {
      provide: GET_CONTACT_USE_CASE,
      useFactory: (contactRepository: PrismaContactRepository) =>
        new GetContactUseCase(contactRepository),
      inject: [CONTACT_REPOSITORY],
    },
    {
      provide: UPDATE_CONTACT_USE_CASE,
      useFactory: (contactRepository: PrismaContactRepository) =>
        new UpdateContactUseCase(contactRepository),
      inject: [CONTACT_REPOSITORY],
    },
    {
      provide: DELETE_CONTACT_USE_CASE,
      useFactory: (contactRepository: PrismaContactRepository) =>
        new DeleteContactUseCase(contactRepository),
      inject: [CONTACT_REPOSITORY],
    },
  ],
})
export class ContactModule {}
