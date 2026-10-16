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
  CONTACT_DELETE_ANY_PERMISSION,
  CONTACT_READ_ANY_PERMISSION,
} from '../../../../iam/domain/constants/permission-name.constants';
import type { AuditedAdminDeleteUserContact } from '../../../application/audit/contact-audit-descriptors';
import { DeleteContactCommand } from '../../../application/commands/delete-contact.command';
import { CreateContactResult } from '../../../application/dto/create-contact.result';
import { ListUserContactsResult } from '../../../application/dto/list-user-contacts.result';
import { GetContactQuery } from '../../../application/queries/get-contact.query';
import { ListUserContactsQuery } from '../../../application/queries/list-user-contacts.query';
import {
  ADMIN_DELETE_USER_CONTACT_USE_CASE,
  ADMIN_GET_USER_CONTACT_USE_CASE,
  ADMIN_LIST_USER_CONTACTS_USE_CASE,
} from '../../../application/tokens';
import { ApiContactListQueryDocs } from '../decorators/api-contact-list-query-docs.decorator';
import {
  AdminContactOwnerRouteParamsDto,
  AdminUserContactRouteParamsDto,
} from '../dto/admin-user-contact-route-params.dto';
import { ListContactsQueryDto } from '../dto/list-contacts-query.dto';
import {
  ListUserContactsHttpResponseDto,
  ListUserContactsResponseDto,
} from '../dto/list-user-contacts-response.dto';
import {
  ContactHttpResponseDto,
  ContactResponseDto,
} from '../dto/contact-response.dto';
import { ContactPresenter } from '../presenters/contact.presenter';

/**
 * Admin moderation of another user's contacts: list, view, delete. There is
 * deliberately no update route.
 */
@ApiTags('Admin User Contacts')
@ApiBearerAuth('access-token')
@Controller('admin/users/:userId/contacts')
export class AdminUserContactsController {
  constructor(
    @Inject(ADMIN_LIST_USER_CONTACTS_USE_CASE)
    private readonly listUserContacts: UseCase<
      ListUserContactsQuery,
      Result<ListUserContactsResult, string>
    >,
    @Inject(ADMIN_GET_USER_CONTACT_USE_CASE)
    private readonly getUserContact: UseCase<
      GetContactQuery,
      Result<CreateContactResult, string>
    >,
    @Inject(ADMIN_DELETE_USER_CONTACT_USE_CASE)
    private readonly deleteUserContact: AuditedAdminDeleteUserContact,
  ) {}

  @Get()
  @RequirePermissions(CONTACT_READ_ANY_PERMISSION)
  @ApiListEndpointDocs({
    summary: "List another user's contacts",
    description:
      'Returns a paginated list of contacts owned by the given user. Admin moderation route.',
    badRequestDescription:
      'The route or query parameters could not be processed.',
    successDescription: 'Contact items owned by the given user.',
    responseType: ListUserContactsHttpResponseDto,
  })
  @ApiContactListQueryDocs()
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse('The caller is missing contact.read_any.')
  @ApiNotFoundErrorResponse('The requested user was not found.')
  async listContacts(
    @Param() params: AdminContactOwnerRouteParamsDto,
    @Query() query: ListContactsQueryDto,
  ): Promise<
    HttpSuccessResponse<
      ListUserContactsResponseDto,
      ReturnType<typeof ContactPresenter.toContactListPaginationMeta>
    >
  > {
    const result = await this.listUserContacts.execute(
      new ListUserContactsQuery(
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
      ContactPresenter.toUserContactListResponse(result.value),
      ContactPresenter.toContactListPaginationMeta(result.value),
    );
  }

  @Get(':contactId')
  @RequirePermissions(CONTACT_READ_ANY_PERMISSION)
  @ApiReadEndpointDocs({
    summary: "Read one of another user's contacts",
    description:
      'Returns one contact owned by the given user. Admin moderation route.',
    badRequestDescription: 'The route parameters failed validation.',
    successDescription: 'The contact was returned successfully.',
    responseType: ContactHttpResponseDto,
  })
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse('The caller is missing contact.read_any.')
  @ApiNotFoundErrorResponse('The requested user or contact was not found.')
  async getContact(
    @Param() params: AdminUserContactRouteParamsDto,
  ): Promise<HttpSuccessResponse<ContactResponseDto>> {
    const result = await this.getUserContact.execute(
      new GetContactQuery(params.userId, params.contactId),
    );

    if (!result.ok) {
      throw new NotFoundException(result.error);
    }

    return createSuccessResponse(
      ContactPresenter.toContactResponse(result.value),
    );
  }

  @Delete(':contactId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(CONTACT_DELETE_ANY_PERMISSION)
  @ApiDeleteEndpointDocs({
    summary: "Delete one of another user's contacts",
    description:
      'Deletes one contact owned by the given user and records the deletion in the audit log. Admin moderation route.',
    badRequestDescription: 'The route parameters failed validation.',
    successDescription: 'The contact was deleted successfully.',
  })
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse('The caller is missing contact.delete_any.')
  @ApiNotFoundErrorResponse('The requested user or contact was not found.')
  async deleteContact(
    @Param() params: AdminUserContactRouteParamsDto,
    @CurrentUser() currentUser: AuthenticatedUserContext,
  ): Promise<void> {
    const result = await this.deleteUserContact.execute(
      currentUser.userId,
      new DeleteContactCommand(params.userId, params.contactId),
    );

    if (!result.ok) {
      throw new NotFoundException(result.error);
    }
  }
}
