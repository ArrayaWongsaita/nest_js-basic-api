import { Result } from '../../../../shared/application/result';
import { UseCase } from '../../../../shared/application/use-case';
import { ContactRepository } from '../../domain/repositories/contact.repository';
import { DeleteContactCommand } from '../commands/delete-contact.command';

export class DeleteContactUseCase
  implements UseCase<DeleteContactCommand, Result<void, string>>
{
  constructor(private readonly contactRepository: ContactRepository) {}

  async execute(
    command: DeleteContactCommand,
  ): Promise<Result<void, string>> {
    const contact = await this.contactRepository.findByIdAndUserId(
      command.contactId,
      command.userId,
    );

    if (!contact) {
      return Result.failure('Contact was not found.');
    }

    await this.contactRepository.deleteByIdAndUserId(
      command.contactId,
      command.userId,
    );

    return Result.success(undefined);
  }
}
