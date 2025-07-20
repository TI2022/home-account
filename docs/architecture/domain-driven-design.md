# ドメイン駆動設計による工数削減アーキテクチャ

## 概要
ドメイン駆動設計（DDD）とクリーンアーキテクチャを採用することで、仕様変更時の影響範囲を最小限に抑え、新機能追加の工数を削減します。

## アーキテクチャ層

### 1. Domain Layer（ドメイン層）
```typescript
// ビジネスロジックの中心
export class Transaction {
  constructor(
    private readonly id: string,
    private readonly amount: Money,
    private readonly category: Category,
    private readonly date: Date
  ) {}

  // ビジネスルールをカプセル化
  canBeEdited(): boolean {
    return this.date.isAfter(Date.now().subtract(30, 'days'));
  }

  // ドメインイベントの発行
  markAsProcessed(): void {
    this.addDomainEvent(new TransactionProcessedEvent(this.id));
  }
}
```

### 2. Application Layer（アプリケーション層）
```typescript
// ユースケースの実装
export class AddTransactionUseCase {
  constructor(
    private transactionRepository: TransactionRepository,
    private eventBus: EventBus
  ) {}

  async execute(command: AddTransactionCommand): Promise<Result<Transaction>> {
    const transaction = Transaction.create(command);
    
    if (!transaction.canBeAdded()) {
      return Result.failure('Invalid transaction');
    }

    await this.transactionRepository.save(transaction);
    await this.eventBus.publish(transaction.domainEvents);
    
    return Result.success(transaction);
  }
}
```

### 3. Infrastructure Layer（インフラ層）
```typescript
// 外部依存の実装
export class SupabaseTransactionRepository implements TransactionRepository {
  async save(transaction: Transaction): Promise<void> {
    // データベース操作の実装
  }
}
```

## 工数削減のポイント

### ✅ **変更の影響範囲を限定**
- ビジネスロジックの変更はDomain層のみ
- UI変更はPresentation層のみ
- データベース変更はInfrastructure層のみ

### ✅ **テスト容易性**
- 各層を独立してテスト可能
- モック化が容易

### ✅ **新機能追加の簡素化**
- 新しいユースケースはApplication層に追加
- 既存のドメインロジックを再利用 