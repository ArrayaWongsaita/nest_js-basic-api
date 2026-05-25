export interface CreateBookResult {
  readonly id: string;
  readonly userId: string;
  readonly title: string;
  readonly author: string;
  readonly genre: string | null;
  readonly publishedYear: number | null;
  readonly status: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}
