import { Contact } from '../aggregates/contact.aggregate';

export interface ContactListFilters {
  readonly search?: string;
}

export interface PaginatedContacts {
  readonly items: Contact[];
  readonly totalItems: number;
}

export interface ContactRepository {
  save(contact: Contact): Promise<void>;
  findPageByUserId(
    userId: string,
    filters: ContactListFilters,
    page: number,
    limit: number,
  ): Promise<PaginatedContacts>;
  findByIdAndUserId(
    contactId: string,
    userId: string,
  ): Promise<Contact | null>;
  deleteByIdAndUserId(contactId: string, userId: string): Promise<void>;
}
