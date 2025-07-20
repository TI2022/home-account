import { RecurringExpense } from '../domain/RecurringExpense';
import { Result } from '../shared/Result';

export interface RecurringExpenseRepository {
  save(expense: RecurringExpense): Promise<void>;
  update(id: string, expense: RecurringExpense): Promise<void>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<RecurringExpense | null>;
  findAll(): Promise<RecurringExpense[]>;
}

export interface AddRecurringExpenseCommand {
  name: string;
  amount: number;
  category: string;
  paymentSchedule: { month: number; day: number }[];
  description?: string;
  isActive?: boolean;
  userId: string;
}

export interface UpdateRecurringExpenseCommand {
  id: string;
  name?: string;
  amount?: number;
  category?: string;
  paymentSchedule?: { month: number; day: number }[];
  description?: string;
  isActive?: boolean;
}

export class AddRecurringExpenseUseCase {
  constructor(
    private recurringExpenseRepository: RecurringExpenseRepository
  ) {}

  async execute(command: AddRecurringExpenseCommand): Promise<Result<RecurringExpense>> {
    try {
      const expense = RecurringExpense.create({
        name: command.name,
        amount: command.amount,
        category: command.category,
        paymentSchedule: command.paymentSchedule,
        description: command.description,
        isActive: command.isActive,
        userId: command.userId,
      });

      if (!expense.canBeActivated()) {
        return Result.failure('必須項目が不足しています');
      }

      await this.recurringExpenseRepository.save(expense);
      expense.markAsCreated();

      return Result.success(expense);
    } catch (error) {
      return Result.failure(error instanceof Error ? error.message : 'Unknown error');
    }
  }
}

export class UpdateRecurringExpenseUseCase {
  constructor(
    private recurringExpenseRepository: RecurringExpenseRepository
  ) {}

  async execute(command: UpdateRecurringExpenseCommand): Promise<Result<RecurringExpense>> {
    try {
      const existingExpense = await this.recurringExpenseRepository.findById(command.id);
      if (!existingExpense) {
        return Result.failure('定期支出が見つかりません');
      }

      let updatedExpense = existingExpense;

      if (command.name !== undefined) {
        updatedExpense = updatedExpense.updateName(command.name);
      }

      if (command.amount !== undefined) {
        updatedExpense = updatedExpense.updateAmount(command.amount);
      }

      if (command.category !== undefined) {
        updatedExpense = updatedExpense.updateCategory(command.category);
      }

      if (command.paymentSchedule !== undefined) {
        updatedExpense = updatedExpense.updatePaymentSchedule(command.paymentSchedule);
      }

      if (command.isActive !== undefined) {
        updatedExpense = command.isActive 
          ? updatedExpense.activate()
          : updatedExpense.deactivate();
      }

      await this.recurringExpenseRepository.update(command.id, updatedExpense);
      updatedExpense.markAsUpdated();

      return Result.success(updatedExpense);
    } catch (error) {
      return Result.failure(error instanceof Error ? error.message : 'Unknown error');
    }
  }
}

export class DeleteRecurringExpenseUseCase {
  constructor(
    private recurringExpenseRepository: RecurringExpenseRepository
  ) {}

  async execute(id: string): Promise<Result<void>> {
    try {
      const expense = await this.recurringExpenseRepository.findById(id);
      if (!expense) {
        return Result.failure('定期支出が見つかりません');
      }

      if (!expense.canBeDeleted()) {
        return Result.failure('この定期支出は削除できません');
      }

      await this.recurringExpenseRepository.delete(id);
      return Result.success();
    } catch (error) {
      return Result.failure(error instanceof Error ? error.message : 'Unknown error');
    }
  }
} 