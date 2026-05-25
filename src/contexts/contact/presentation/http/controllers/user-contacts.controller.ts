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
import { UpdateContactBodyDto } from '../dto/update-contact-body.dto';
import { UserContactOwnerParamsDto } from '../dto/user-contact-owner-params.dto';
import { UserContactRouteParamsDto } from '../dto/user-contact-route-params.dto';
import { ContactPresenter } from '../presenters/contact.presenter';

@Public()
@ApiTags('Contact (By User ID)')
@Controller('users/:userId/contacts')
export class UserContactsController {
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
  @ApiCreateEndpointDocs({
    summary: 'Create a contact by user ID',
    description:
      'Creates a contact for the user identified directly in the route without using a Bearer token.',
    badRequestDescription:
      'The route parameters or request payload failed validation.',
    successDescription: 'The contact was created successfully.',
    responseType: ContactHttpResponseDto,
  })
  async createContact(
    @Param() params: UserContactOwnerParamsDto,
    @Body() body: CreateContactBodyDto,
  ): Promise<HttpSuccessResponse<ContactResponseDto>> {
    const result = await this.createContactUseCase.execute(
      new CreateContactCommand(
        params.userId,
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
  @ApiListEndpointDocs({
    summary: 'List contacts by user ID',
    description:
      'Returns a paginated list of contacts owned by the user identified directly in the route without using a Bearer token. Optional query filters can narrow the result set.',
    badRequestDescription:
      'The route parameters or query parameters failed validation.',
    successDescription: 'Contacts owned by the specified user.',
    responseType: ListUserContactsHttpResponseDto,
  })
  @ApiContactListQueryDocs()
  async listContacts(
    @Param() params: UserContactOwnerParamsDto,
    @Query() query: ListContactsQueryDto,
  ): Promise<
    HttpSuccessResponse<ListUserContactsResponseDto, ReturnType<typeof ContactPresenter.toContactListPaginationMeta>>
  > {
    const result = await this.listUserContactsUseCase.execute(
      new ListUserContactsQuery(
        params.userId,
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
  @ApiReadEndpointDocs({
    summary: 'Read one contact by user ID',
    description:
      'Returns one contact owned by the user identified directly in the route without using a Bearer token.',
    badRequestDescription: 'The route parameters failed validation.',
    successDescription: 'The contact was returned successfully.',
    responseType: ContactHttpResponseDto,
  })
  @ApiNotFoundErrorResponse(
    'The requested contact was not found for the specified user.',
  )
  async getContact(
    @Param() params: UserContactRouteParamsDto,
  ): Promise<HttpSuccessResponse<ContactResponseDto>> {
    const result = await this.getContactUseCase.execute(
      new GetContactQuery(params.userId, params.contactId),
    );

    if (!result.ok) {
      throw new NotFoundException(result.error);
    }

    return createSuccessResponse(
      ContactPresenter.toContactResponse(result.value),
    );
  }

  @Patch(':contactId')
  @ApiUpdateEndpointDocs({
    summary: 'Update one contact by user ID',
    description:
      'Partially updates one contact owned by the user identified directly in the route without using a Bearer token.',
    badRequestDescription:
      'The route parameters or request payload failed validation.',
    successDescription: 'The contact was updated successfully.',
    responseType: ContactHttpResponseDto,
  })
  @ApiNotFoundErrorResponse(
    'The requested contact was not found for the specified user.',
  )
  async updateContact(
    @Param() params: UserContactRouteParamsDto,
    @Body() body: UpdateContactBodyDto,
  ): Promise<HttpSuccessResponse<ContactResponseDto>> {
    const result = await this.updateContactUseCase.execute(
      new UpdateContactCommand(
        params.userId,
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
  @ApiDeleteEndpointDocs({
    summary: 'Delete one contact by user ID',
    description:
      'Deletes one contact owned by the user identified directly in the route without using a Bearer token.',
    badRequestDescription: 'The route parameters failed validation.',
    successDescription: 'The contact was deleted successfully.',
  })
  @ApiNotFoundErrorResponse(
    'The requested contact was not found for the specified user.',
  )
  async deleteContact(
    @Param() params: UserContactRouteParamsDto,
  ): Promise<void> {
    const result = await this.deleteContactUseCase.execute(
      new DeleteContactCommand(params.userId, params.contactId),
    );

    if (!result.ok) {
      throw new NotFoundException(result.error);
    }
  }
}
