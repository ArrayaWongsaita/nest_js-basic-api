import { Result } from '../../../../shared/application/result';
import { UseCase } from '../../../../shared/application/use-case';
import { ContactRepository } from '../../domain/repositories/contact.repository';
import { CreateContactResult } from '../dto/create-contact.result';
import { UpdateContactCommand } from '../commands/update-contact.command';
import { mapContactToResult } from './create-contact.use-case';

export class UpdateContactUseCase
  implements UseCase<UpdateContactCommand, Result<CreateContactResult, string>>
{
  constructor(private readonly contactRepository: ContactRepository) {}

  async execute(
    command: UpdateContactCommand,
  ): Promise<Result<CreateContactResult, string>> {
    const contact = await this.contactRepository.findByIdAndUserId(
      command.contactId,
      command.userId,
    );

    if (!contact) {
      return Result.failure('Contact was not found.');
    }

    contact.update({
      firstName: command.firstName,
      lastName: command.lastName,
      email: command.email,
      phone: command.phone,
      company: command.company,
      address: command.address,
    });

    await this.contactRepository.save(contact);

    return Result.success(mapContactToResult(contact));
  }
}
