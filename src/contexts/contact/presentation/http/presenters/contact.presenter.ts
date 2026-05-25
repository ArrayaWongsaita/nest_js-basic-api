import { CreateContactResult } from '../../../application/dto/create-contact.result';
import { ListUserContactsResult } from '../../../application/dto/list-user-contacts.result';
import { ContactListPaginationMetaDto } from '../dto/contact-list-pagination-meta.dto';
import { ListUserContactsResponseDto } from '../dto/list-user-contacts-response.dto';
import { ContactResponseDto } from '../dto/contact-response.dto';

export class ContactPresenter {
  static toContactResponse(result: CreateContactResult): ContactResponseDto {
    return {
      id: result.id,
      userId: result.userId,
      firstName: result.firstName,
      lastName: result.lastName,
      email: result.email,
      phone: result.phone,
      company: result.company,
      address: result.address,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  }

  static toUserContactListResponse(
    result: ListUserContactsResult,
  ): ListUserContactsResponseDto {
    return {
      userId: result.userId,
      items: result.items.map((item) => this.toContactResponse(item)),
    };
  }

  static toContactListPaginationMeta(
    result: ListUserContactsResult,
  ): ContactListPaginationMetaDto {
    return {
      page: result.meta.page,
      limit: result.meta.limit,
      totalItems: result.meta.totalItems,
      totalPages: result.meta.totalPages,
    };
  }
}
