import { CreateContactResult } from './create-contact.result';

export interface ContactListPaginationResult {
  readonly page: number;
  readonly limit: number;
  readonly totalItems: number;
  readonly totalPages: number;
}

export interface ListUserContactsResult {
  readonly userId: string;
  readonly items: CreateContactResult[];
  readonly meta: ContactListPaginationResult;
}
