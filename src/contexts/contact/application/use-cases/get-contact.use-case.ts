import { Result } from '../../../../shared/application/result';
import { UseCase } from '../../../../shared/application/use-case';
import { ContactRepository } from '../../domain/repositories/contact.repository';
import { CreateContactResult } from '../dto/create-contact.result';
import { GetContactQuery } from '../queries/get-contact.query';
import { mapContactToResult } from './create-contact.use-case';

export class GetContactUseCase
  implements UseCase<GetContactQuery, Result<CreateContactResult, string>>
{
  constructor(private readonly contactRepository: ContactRepository) {}

  async execute(
    query: GetContactQuery,
  ): Promise<Result<CreateContactResult, string>> {
    const contact = await this.contactRepository.findByIdAndUserId(
      query.contactId,
      query.userId,
    );

    if (!contact) {
      return Result.failure('Contact was not found.');
    }

    return Result.success(mapContactToResult(contact));
  }
}
