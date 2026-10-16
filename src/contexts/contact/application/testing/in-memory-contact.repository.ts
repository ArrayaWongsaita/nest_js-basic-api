import { Contact } from '../../domain/aggregates/contact.aggregate';
import {
  ContactListFilters,
  ContactRepository,
  PaginatedContacts,
} from '../../domain/repositories/contact.repository';

/** In-memory ContactRepository for specs and e2e tests. */
export class InMemoryContactRepository implements ContactRepository {
  private readonly contacts = new Map<string, Contact>();

  save(contact: Contact): Promise<void> {
    this.contacts.set(contact.id.toString(), contact);

    return Promise.resolve();
  }

  findPageByUserId(
    userId: string,
    filters: ContactListFilters,
    page: number,
    limit: number,
  ): Promise<PaginatedContacts> {
    const search = filters.search?.trim().toLowerCase();
    const matching = [...this.contacts.values()]
      .filter((e) => e.userId === userId)
      .filter(
        (e) =>
          !search ||
          [e.firstName, e.lastName ?? '', e.email ?? '', e.company ?? ''].some(
            (text) => text.toLowerCase().includes(search),
          ),
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return Promise.resolve({
      items: matching.slice((page - 1) * limit, page * limit),
      totalItems: matching.length,
    });
  }

  findByIdAndUserId(
    contactId: string,
    userId: string,
  ): Promise<Contact | null> {
    const contact = this.contacts.get(contactId);

    return Promise.resolve(
      contact && contact.userId === userId ? contact : null,
    );
  }

  deleteByIdAndUserId(contactId: string, userId: string): Promise<void> {
    if (this.contacts.get(contactId)?.userId === userId) {
      this.contacts.delete(contactId);
    }

    return Promise.resolve();
  }
}
