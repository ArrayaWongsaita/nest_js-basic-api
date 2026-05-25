export interface CreateTodoResult {
  readonly id: string;
  readonly userId: string;
  readonly title: string;
  readonly description: string | null;
  readonly isCompleted: boolean;
  readonly dueDate: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}
