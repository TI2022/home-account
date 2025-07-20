import { Money } from './Money';
import { Category } from './Category';
import { DomainEvent } from './DomainEvent';

export class RecurringExpenseCreatedEvent extends DomainEvent {
  constructor(public readonly expenseId: string) {
    super();
  }
}

export class RecurringExpenseUpdatedEvent extends DomainEvent {
  constructor(public readonly expenseId: string) {
    super();
  }
}

export class PaymentSchedule {
  constructor(
    private readonly schedules: { month: number; day: number }[]
  ) {
    this.validate();
  }

  private validate(): void {
    if (this.schedules.length === 0) {
      throw new Error('支払月を少なくとも1つ選択してください');
    }

    for (const schedule of this.schedules) {
      if (schedule.month < 1 || schedule.month > 12) {
        throw new Error('月は1-12の範囲で指定してください');
      }
      if (schedule.day < 1 || schedule.day > 31) {
        throw new Error('日は1-31の範囲で指定してください');
      }
    }
  }

  getSchedules(): { month: number; day: number }[] {
    return [...this.schedules];
  }

  getFrequency(): 'monthly' | 'quarterly' | 'yearly' | 'custom' {
    const months = this.schedules.map(s => s.month).sort((a, b) => a - b);
    
    if (months.length === 12) return 'monthly';
    if (months.length === 4) return 'quarterly';
    if (months.length === 1) return 'yearly';
    return 'custom';
  }

  hasPaymentInMonth(month: number): boolean {
    return this.schedules.some(s => s.month === month);
  }

  getPaymentDayForMonth(month: number): number | undefined {
    const schedule = this.schedules.find(s => s.month === month);
    return schedule?.day;
  }
}

export class RecurringExpense {
  private domainEvents: DomainEvent[] = [];

  constructor(
    private readonly id: string,
    private name: string,
    private amount: Money,
    private category: Category,
    private paymentSchedule: PaymentSchedule,
    private description: string = '',
    private isActive: boolean = true,
    private userId: string
  ) {}

  // ファクトリメソッド
  static create(data: {
    name: string;
    amount: number;
    category: string;
    paymentSchedule: { month: number; day: number }[];
    description?: string;
    isActive?: boolean;
    userId: string;
  }): RecurringExpense {
    const money = Money.create(data.amount);
    const category = Category.create(data.category);
    const schedule = new PaymentSchedule(data.paymentSchedule);

    return new RecurringExpense(
      crypto.randomUUID(),
      data.name,
      money,
      category,
      schedule,
      data.description || '',
      data.isActive ?? true,
      data.userId
    );
  }

  // ビジネスルール
  canBeActivated(): boolean {
    return this.name.trim().length > 0 && this.amount.isPositive();
  }

  canBeDeactivated(): boolean {
    return true; // 常に無効化可能
  }

  canBeDeleted(): boolean {
    return true; // 常に削除可能
  }

  // ドメインイベント
  markAsCreated(): void {
    this.addDomainEvent(new RecurringExpenseCreatedEvent(this.id));
  }

  markAsUpdated(): void {
    this.addDomainEvent(new RecurringExpenseUpdatedEvent(this.id));
  }

  private addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  getDomainEvents(): DomainEvent[] {
    return this.domainEvents;
  }

  clearDomainEvents(): void {
    this.domainEvents = [];
  }

  // ゲッター
  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getAmount(): Money {
    return this.amount;
  }

  getCategory(): Category {
    return this.category;
  }

  getPaymentSchedule(): PaymentSchedule {
    return this.paymentSchedule;
  }

  getDescription(): string {
    return this.description;
  }

  isActive(): boolean {
    return this.isActive;
  }

  getUserId(): string {
    return this.userId;
  }

  // 不変性を保ちながら更新
  updateName(newName: string): RecurringExpense {
    if (newName.trim().length === 0) {
      throw new Error('支出名は必須です');
    }
    
    return new RecurringExpense(
      this.id,
      newName,
      this.amount,
      this.category,
      this.paymentSchedule,
      this.description,
      this.isActive,
      this.userId
    );
  }

  updateAmount(newAmount: number): RecurringExpense {
    const newMoney = Money.create(newAmount);
    
    return new RecurringExpense(
      this.id,
      this.name,
      newMoney,
      this.category,
      this.paymentSchedule,
      this.description,
      this.isActive,
      this.userId
    );
  }

  updateCategory(newCategory: string): RecurringExpense {
    const newCategoryObj = Category.create(newCategory);
    
    return new RecurringExpense(
      this.id,
      this.name,
      this.amount,
      newCategoryObj,
      this.paymentSchedule,
      this.description,
      this.isActive,
      this.userId
    );
  }

  updatePaymentSchedule(newSchedule: { month: number; day: number }[]): RecurringExpense {
    const newPaymentSchedule = new PaymentSchedule(newSchedule);
    
    return new RecurringExpense(
      this.id,
      this.name,
      this.amount,
      this.category,
      newPaymentSchedule,
      this.description,
      this.isActive,
      this.userId
    );
  }

  activate(): RecurringExpense {
    if (!this.canBeActivated()) {
      throw new Error('有効化できません。必須項目を確認してください');
    }
    
    return new RecurringExpense(
      this.id,
      this.name,
      this.amount,
      this.category,
      this.paymentSchedule,
      this.description,
      true,
      this.userId
    );
  }

  deactivate(): RecurringExpense {
    return new RecurringExpense(
      this.id,
      this.name,
      this.amount,
      this.category,
      this.paymentSchedule,
      this.description,
      false,
      this.userId
    );
  }
} 