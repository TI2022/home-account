import { Money } from './Money';
import { Category } from './Category';
import { DomainEvent } from './DomainEvent';

export class TransactionProcessedEvent extends DomainEvent {
  constructor(public readonly transactionId: string) {
    super();
  }
}

export class Transaction {
  private domainEvents: DomainEvent[] = [];

  constructor(
    private readonly id: string,
    private amount: Money,
    private category: Category,
    private date: Date,
    private memo: string = '',
    private isMock: boolean = false,
    private scenarioId?: string
  ) {}

  // ファクトリメソッド
  static create(data: {
    amount: number;
    category: string;
    date: string;
    memo?: string;
    isMock?: boolean;
    scenarioId?: string;
  }): Transaction {
    const money = Money.create(data.amount);
    const category = Category.create(data.category);
    const date = new Date(data.date);

    return new Transaction(
      crypto.randomUUID(),
      money,
      category,
      date,
      data.memo || '',
      data.isMock || false,
      data.scenarioId
    );
  }

  // ビジネスルール
  canBeEdited(): boolean {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return this.date >= thirtyDaysAgo;
  }

  canBeDeleted(): boolean {
    return this.isMock || this.canBeEdited();
  }

  // ドメインイベント
  markAsProcessed(): void {
    this.addDomainEvent(new TransactionProcessedEvent(this.id));
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

  getAmount(): Money {
    return this.amount;
  }

  getCategory(): Category {
    return this.category;
  }

  getDate(): Date {
    return this.date;
  }

  getMemo(): string {
    return this.memo;
  }

  isMockTransaction(): boolean {
    return this.isMock;
  }

  getScenarioId(): string | undefined {
    return this.scenarioId;
  }

  // 不変性を保ちながら更新
  updateAmount(newAmount: number): Transaction {
    const newMoney = Money.create(newAmount);
    return new Transaction(
      this.id,
      newMoney,
      this.category,
      this.date,
      this.memo,
      this.isMock,
      this.scenarioId
    );
  }

  updateCategory(newCategory: string): Transaction {
    const newCategoryObj = Category.create(newCategory);
    return new Transaction(
      this.id,
      this.amount,
      newCategoryObj,
      this.date,
      this.memo,
      this.isMock,
      this.scenarioId
    );
  }
} 