import { Result } from '../../../../shared/application/result';
import { AuditedAction } from '../../../iam/application/audit/audited-action';
import type { AuditDescriptor } from '../../../iam/application/audit/audited-action';
import {
  AUDIT_ACTIONS,
  AUDIT_TARGET_TYPES,
} from '../../../iam/domain/constants/audit-action.constants';
import { DeleteNoteCommand } from '../commands/delete-note.command';

export type AuditedAdminDeleteUserNote = AuditedAction<
  DeleteNoteCommand,
  Result<void, string>
>;

/** `command.userId` is the owner of the note, not the acting admin. */
export function describeAdminNoteDeletion(
  command: DeleteNoteCommand,
): AuditDescriptor {
  return {
    action: AUDIT_ACTIONS.noteDeletedByAdmin,
    targetType: AUDIT_TARGET_TYPES.note,
    targetId: command.noteId,
    details: { ownerUserId: command.userId },
  };
}
