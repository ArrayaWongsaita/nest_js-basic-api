import { UseCase } from '../../../../shared/application/use-case';
import { Contact } from '../../domain/aggregates/contact.aggregate';
import { ContactRepository } from '../../domain/repositories/contact.repository';
import { CreateContactCommand } from '../commands/create-contact.command';
import { CreateContactResult } from '../dto/create-contact.result';

export class CreateContactUseCase
  implements UseCase<CreateContactCommand, CreateContactResult>
{
  constructor(private readonly contactRepository: ContactRepository) {}

  async execute(command: CreateContactCommand): Promise<CreateContactResult> {
    const contact = Contact.create({
      userId: command.userId,
      firstName: command.firstName,
      lastName: command.lastName,
      email: command.email,
      phone: command.phone,
      company: command.company,
      address: command.address,
    });

    await this.contactRepository.save(contact);

    return mapContactToResult(contact);
  }
}

export function mapContactToResult(contact: Contact): CreateContactResult {
  return {
    id: contact.id.toString(),
    userId: contact.userId,
    firstName: contact.firstName,
    lastName: contact.lastName,
    email: contact.email,
    phone: contact.phone,
    company: contact.company,
    address: contact.address,
    createdAt: contact.createdAt.toISOString(),
    updatedAt: contact.updatedAt.toISOString(),
  };
}
