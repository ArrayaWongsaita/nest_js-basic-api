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
  CONTACT_CREATE_OWN_PERMISSION,
  CONTACT_DELETE_OWN_PERMISSION,
  CONTACT_READ_OWN_PERMISSION,
  CONTACT_UPDATE_OWN_PERMISSION,
} from '../../../../iam/domain/constants/permission-name.constants';
import { CreateContactCommand } from '../../../application/commands/create-contact.command';
import { DeleteContactCommand } from '../../../application/commands/delete-contact.command';
import { UpdateContactCommand } from '../../../application/commands/update-contact.command';
import { GetContactQuery } from '../../../application/queries/get-contact.query';
import { ListUserContactsQuery } from '../../../application/queries/list-user-contacts.query';
import {
  CREATE_CONTACT_USE_CASE,
  DELETE_CONTACT_USE_CASE,
  GET_CONTACT_USE_CASE,
  LIST_USER_CONTACTS_USE_CASE,
  UPDATE_CONTACT_USE_CASE,
} from '../../../application/tokens';
import { CreateContactUseCase } from '../../../application/use-cases/create-contact.use-case';
import { DeleteContactUseCase } from '../../../application/use-cases/delete-contact.use-case';
import { GetContactUseCase } from '../../../application/use-cases/get-contact.use-case';
import { ListUserContactsUseCase } from '../../../application/use-cases/list-user-contacts.use-case';
import { UpdateContactUseCase } from '../../../application/use-cases/update-contact.use-case';
import { ApiContactListQueryDocs } from '../decorators/api-contact-list-query-docs.decorator';
import { CreateContactBodyDto } from '../dto/create-contact-body.dto';
import {
  ListUserContactsHttpResponseDto,
  ListUserContactsResponseDto,
} from '../dto/list-user-contacts-response.dto';
import { ListContactsQueryDto } from '../dto/list-contacts-query.dto';
import {
  ContactHttpResponseDto,
  ContactResponseDto,
} from '../dto/contact-response.dto';
import { ContactRouteParamsDto } from '../dto/contact-route-params.dto';
import { UpdateContactBodyDto } from '../dto/update-contact-body.dto';
import { ContactPresenter } from '../presenters/contact.presenter';

@ApiTags('Contact (Authenticated)')
@ApiBearerAuth('access-token')
@Controller('contacts')
export class AuthenticatedContactsController {
  constructor(
    @Inject(CREATE_CONTACT_USE_CASE)
    private readonly createContactUseCase: CreateContactUseCase,
    @Inject(LIST_USER_CONTACTS_USE_CASE)
    private readonly listUserContactsUseCase: ListUserContactsUseCase,
    @Inject(GET_CONTACT_USE_CASE)
    private readonly getContactUseCase: GetContactUseCase,
    @Inject(UPDATE_CONTACT_USE_CASE)
    private readonly updateContactUseCase: UpdateContactUseCase,
    @Inject(DELETE_CONTACT_USE_CASE)
    private readonly deleteContactUseCase: DeleteContactUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions(CONTACT_CREATE_OWN_PERMISSION)
  @ApiCreateEndpointDocs({
    summary: 'Create a contact for the authenticated user',
    description:
      'Creates a contact for the user represented by the current Bearer access token.',
    badRequestDescription: 'The request payload failed validation.',
    successDescription: 'The contact was created successfully.',
    responseType: ContactHttpResponseDto,
  })
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse(
    'The authenticated user is missing contact.create_own.',
  )
  async createContact(
    @Body() body: CreateContactBodyDto,
    @CurrentUser() currentUser: AuthenticatedUserContext,
  ): Promise<HttpSuccessResponse<ContactResponseDto>> {
    const result = await this.createContactUseCase.execute(
      new CreateContactCommand(
        currentUser.userId,
        body.firstName,
        body.lastName,
        body.email,
        body.phone,
        body.company,
        body.address,
      ),
    );

    return createSuccessResponse(ContactPresenter.toContactResponse(result));
  }

  @Get()
  @RequirePermissions(CONTACT_READ_OWN_PERMISSION)
  @ApiListEndpointDocs({
    summary: 'List contacts for the authenticated user',
    description:
      'Returns a paginated list of contacts owned by the user represented by the current Bearer access token. Optional query filters can narrow the result set.',
    badRequestDescription:
      'The request query parameters could not be processed.',
    successDescription: 'Contacts owned by the authenticated user.',
    responseType: ListUserContactsHttpResponseDto,
  })
  @ApiContactListQueryDocs()
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse(
    'The authenticated user is missing contact.read_own.',
  )
  async listContacts(
    @Query() query: ListContactsQueryDto,
    @CurrentUser() currentUser: AuthenticatedUserContext,
  ): Promise<
    HttpSuccessResponse<ListUserContactsResponseDto, ReturnType<typeof ContactPresenter.toContactListPaginationMeta>>
  > {
    const result = await this.listUserContactsUseCase.execute(
      new ListUserContactsQuery(
        currentUser.userId,
        query.search,
        query.page,
        query.limit,
      ),
    );

    return createSuccessResponse(
      ContactPresenter.toUserContactListResponse(result),
      ContactPresenter.toContactListPaginationMeta(result),
    );
  }

  @Get(':contactId')
  @RequirePermissions(CONTACT_READ_OWN_PERMISSION)
  @ApiReadEndpointDocs({
    summary: 'Read one contact for the authenticated user',
    description:
      'Returns one contact owned by the user represented by the current Bearer access token.',
    badRequestDescription: 'The route parameters failed validation.',
    successDescription: 'The contact was returned successfully.',
    responseType: ContactHttpResponseDto,
  })
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse(
    'The authenticated user is missing contact.read_own.',
  )
  @ApiNotFoundErrorResponse('The requested contact was not found.')
  async getContact(
    @Param() params: ContactRouteParamsDto,
    @CurrentUser() currentUser: AuthenticatedUserContext,
  ): Promise<HttpSuccessResponse<ContactResponseDto>> {
    const result = await this.getContactUseCase.execute(
      new GetContactQuery(currentUser.userId, params.contactId),
    );

    if (!result.ok) {
      throw new NotFoundException(result.error);
    }

    return createSuccessResponse(
      ContactPresenter.toContactResponse(result.value),
    );
  }

  @Patch(':contactId')
  @RequirePermissions(CONTACT_UPDATE_OWN_PERMISSION)
  @ApiUpdateEndpointDocs({
    summary: 'Update one contact for the authenticated user',
    description:
      'Partially updates one contact owned by the user represented by the current Bearer access token.',
    badRequestDescription:
      'The route parameters or request payload failed validation.',
    successDescription: 'The contact was updated successfully.',
    responseType: ContactHttpResponseDto,
  })
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse(
    'The authenticated user is missing contact.update_own.',
  )
  @ApiNotFoundErrorResponse('The requested contact was not found.')
  async updateContact(
    @Param() params: ContactRouteParamsDto,
    @Body() body: UpdateContactBodyDto,
    @CurrentUser() currentUser: AuthenticatedUserContext,
  ): Promise<HttpSuccessResponse<ContactResponseDto>> {
    const result = await this.updateContactUseCase.execute(
      new UpdateContactCommand(
        currentUser.userId,
        params.contactId,
        body.firstName,
        body.lastName,
        body.email,
        body.phone,
        body.company,
        body.address,
      ),
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
  @RequirePermissions(CONTACT_DELETE_OWN_PERMISSION)
  @ApiDeleteEndpointDocs({
    summary: 'Delete one contact for the authenticated user',
    description:
      'Deletes one contact owned by the user represented by the current Bearer access token.',
    badRequestDescription: 'The route parameters failed validation.',
    successDescription: 'The contact was deleted successfully.',
  })
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse(
    'The authenticated user is missing contact.delete_own.',
  )
  @ApiNotFoundErrorResponse('The requested contact was not found.')
  async deleteContact(
    @Param() params: ContactRouteParamsDto,
    @CurrentUser() currentUser: AuthenticatedUserContext,
  ): Promise<void> {
    const result = await this.deleteContactUseCase.execute(
      new DeleteContactCommand(currentUser.userId, params.contactId),
    );

    if (!result.ok) {
      throw new NotFoundException(result.error);
    }
  }
}
