import { Result } from '../../../../shared/application/result';
import { AuditedAction } from '../../../iam/application/audit/audited-action';
import type { AuditDescriptor } from '../../../iam/application/audit/audited-action';
import {
  AUDIT_ACTIONS,
  AUDIT_TARGET_TYPES,
} from '../../../iam/domain/constants/audit-action.constants';
import { DeleteBookCommand } from '../commands/delete-book.command';

export type AuditedAdminDeleteUserBook = AuditedAction<
  DeleteBookCommand,
  Result<void, string>
>;

/** `command.userId` is the owner of the book, not the acting admin. */
export function describeAdminBookDeletion(
  command: DeleteBookCommand,
): AuditDescriptor {
  return {
    action: AUDIT_ACTIONS.bookDeletedByAdmin,
    targetType: AUDIT_TARGET_TYPES.book,
    targetId: command.bookId,
    details: { ownerUserId: command.userId },
  };
}
