import { Result } from '../../../../shared/application/result';
import { AuditedAction } from '../../../iam/application/audit/audited-action';
import type { AuditDescriptor } from '../../../iam/application/audit/audited-action';
import {
  AUDIT_ACTIONS,
  AUDIT_TARGET_TYPES,
} from '../../../iam/domain/constants/audit-action.constants';
import { DeleteExpenseCommand } from '../commands/delete-expense.command';

export type AuditedAdminDeleteUserExpense = AuditedAction<
  DeleteExpenseCommand,
  Result<void, string>
>;

/** `command.userId` is the owner of the expense, not the acting admin. */
export function describeAdminExpenseDeletion(
  command: DeleteExpenseCommand,
): AuditDescriptor {
  return {
    action: AUDIT_ACTIONS.expenseDeletedByAdmin,
    targetType: AUDIT_TARGET_TYPES.expense,
    targetId: command.expenseId,
    details: { ownerUserId: command.userId },
  };
}
