export interface CreateContactResult {
  readonly id: string;
  readonly userId: string;
  readonly firstName: string;
  readonly lastName: string | null;
  readonly email: string | null;
  readonly phone: string | null;
  readonly company: string | null;
  readonly address: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}
