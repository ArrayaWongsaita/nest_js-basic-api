import { Result } from '../../../../shared/application/result';
import { AuditedAction } from '../../../iam/application/audit/audited-action';
import type { AuditDescriptor } from '../../../iam/application/audit/audited-action';
import {
  AUDIT_ACTIONS,
  AUDIT_TARGET_TYPES,
} from '../../../iam/domain/constants/audit-action.constants';
import { DeleteContactCommand } from '../commands/delete-contact.command';

export type AuditedAdminDeleteUserContact = AuditedAction<
  DeleteContactCommand,
  Result<void, string>
>;

/** `command.userId` is the owner of the contact, not the acting admin. */
export function describeAdminContactDeletion(
  command: DeleteContactCommand,
): AuditDescriptor {
  return {
    action: AUDIT_ACTIONS.contactDeletedByAdmin,
    targetType: AUDIT_TARGET_TYPES.contact,
    targetId: command.contactId,
    details: { ownerUserId: command.userId },
  };
}
