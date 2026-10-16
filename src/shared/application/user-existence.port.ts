/**
 * Narrow cross-context question: "does this user exist?". Owned by shared so
 * domain contexts (todo, note, ...) can ask it without depending on IAM.
 * IAM provides the implementation under the `USER_EXISTENCE` token.
 */
export interface UserExistencePort {
  exists(userId: string): Promise<boolean>;
}
