import { Result } from '../../../../shared/application/result';
import { AuditedAction } from '../../../iam/application/audit/audited-action';
import type { AuditDescriptor } from '../../../iam/application/audit/audited-action';
import {
  AUDIT_ACTIONS,
  AUDIT_TARGET_TYPES,
} from '../../../iam/domain/constants/audit-action.constants';
import { DeleteMovieCommand } from '../commands/delete-movie.command';

export type AuditedAdminDeleteUserMovie = AuditedAction<
  DeleteMovieCommand,
  Result<void, string>
>;

/** `command.userId` is the owner of the movie, not the acting admin. */
export function describeAdminMovieDeletion(
  command: DeleteMovieCommand,
): AuditDescriptor {
  return {
    action: AUDIT_ACTIONS.movieDeletedByAdmin,
    targetType: AUDIT_TARGET_TYPES.movie,
    targetId: command.movieId,
    details: { ownerUserId: command.userId },
  };
}
