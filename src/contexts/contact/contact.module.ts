import { Module } from '@nestjs/common';
import { DbModule } from '../../shared/infrastructure/database';
import { ForExistingUser } from '../../shared/application/for-existing-user';
import { USER_EXISTENCE } from '../../shared/application/tokens';
import type { UserExistencePort } from '../../shared/application/user-existence.port';
import { AuditedAction } from '../iam/application/audit/audited-action';
import type { AuditLogPort } from '../iam/application/ports/audit-log.port';
import { AUDIT_LOG } from '../iam/application/tokens';
import { IamModule } from '../iam/iam.module';
import { describeAdminContactDeletion } from './application/audit/contact-audit-descriptors';
import { ListUserContactsAsResultUseCase } from './application/use-cases/list-user-contacts-as-result.use-case';
import { AdminUserContactsController } from './presentation/http/controllers/admin-user-contacts.controller';
import {
  ADMIN_DELETE_USER_CONTACT_USE_CASE,
  ADMIN_GET_USER_CONTACT_USE_CASE,
  ADMIN_LIST_USER_CONTACTS_USE_CASE,
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

@Module({
  imports: [DbModule, IamModule],
  controllers: [AuthenticatedContactsController, AdminUserContactsController],
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
    {
      provide: ADMIN_LIST_USER_CONTACTS_USE_CASE,
      useFactory: (
        contactRepository: PrismaContactRepository,
        users: UserExistencePort,
      ) =>
        new ForExistingUser(
          new ListUserContactsAsResultUseCase(
            new ListUserContactsUseCase(contactRepository),
          ),
          users,
        ),
      inject: [CONTACT_REPOSITORY, USER_EXISTENCE],
    },
    {
      provide: ADMIN_GET_USER_CONTACT_USE_CASE,
      useFactory: (
        contactRepository: PrismaContactRepository,
        users: UserExistencePort,
      ) => new ForExistingUser(new GetContactUseCase(contactRepository), users),
      inject: [CONTACT_REPOSITORY, USER_EXISTENCE],
    },
    {
      provide: ADMIN_DELETE_USER_CONTACT_USE_CASE,
      useFactory: (
        contactRepository: PrismaContactRepository,
        users: UserExistencePort,
        auditLog: AuditLogPort,
      ) =>
        new AuditedAction(
          new ForExistingUser(new DeleteContactUseCase(contactRepository), users),
          auditLog,
          describeAdminContactDeletion,
        ),
      inject: [CONTACT_REPOSITORY, USER_EXISTENCE, AUDIT_LOG],
    },
  ],
})
export class ContactModule {}
