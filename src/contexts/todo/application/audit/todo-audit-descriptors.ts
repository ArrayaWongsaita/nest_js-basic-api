import { Result } from '../../../../shared/application/result';
import { AuditedAction } from '../../../iam/application/audit/audited-action';
import type { AuditDescriptor } from '../../../iam/application/audit/audited-action';
import {
  AUDIT_ACTIONS,
  AUDIT_TARGET_TYPES,
} from '../../../iam/domain/constants/audit-action.constants';
import { DeleteTodoCommand } from '../commands/delete-todo.command';

export type AuditedAdminDeleteUserTodo = AuditedAction<
  DeleteTodoCommand,
  Result<void, string>
>;

/** `command.userId` is the owner of the todo, not the acting admin. */
export function describeAdminTodoDeletion(
  command: DeleteTodoCommand,
): AuditDescriptor {
  return {
    action: AUDIT_ACTIONS.todoDeletedByAdmin,
    targetType: AUDIT_TARGET_TYPES.todo,
    targetId: command.todoId,
    details: { ownerUserId: command.userId },
  };
}
