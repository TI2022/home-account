# Cypress E2Eテストガイド

## 概要
このプロジェクトでは、React + TypeScriptアプリケーションのE2Eテストに Cypress を使用しています。

## 設定ファイル

### `cypress.config.ts`
```typescript
export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5174',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    viewportWidth: 375,
    viewportHeight: 667,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    env: {
      SUPABASE_URL: process.env.VITE_SUPABASE_URL || '',
      SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || ''
    }
  }
})
```

## ディレクトリ構成
```
cypress/
├── e2e/              # テストファイル
│   ├── auth.cy.ts    # 認証関連テスト
│   └── navigation.cy.ts # ナビゲーションテスト
├── fixtures/         # テストデータ
│   ├── test-transactions.json
│   └── test-users.json
├── screenshots/      # 失敗時スクリーンショット
└── support/          # サポートファイル
    ├── commands.ts   # カスタムコマンド
    └── e2e.ts       # グローバル設定
```

## npmスクリプト
```json
{
  "cypress:open": "cypress open",
  "cypress:run": "cypress run",
  "cypress:run:headed": "cypress run --headed",
  "e2e:dev": "concurrently \"npm run dev\" \"npm run cypress:open\"",
  "e2e:ci": "start-server-and-test preview http://localhost:4173 cypress:run"
}
```

## テストの実行方法

### 開発時（GUI）
```bash
npm run cypress:open
# または開発サーバーと同時起動
npm run e2e:dev
```

### CI環境（ヘッドレス）
```bash
npm run cypress:run
# または
npm run e2e:ci
```

## カスタムコマンド

### 認証関連
```typescript
// ログイン
cy.login('test@example.com', 'password123')

// ログアウト
cy.logout()
```

### テストデータ管理
```typescript
// テストデータ準備
cy.seedTestData()

// テストデータ削除
cy.cleanTestData()
```

### アプリケーション操作
```typescript
// 取引追加
cy.addTransaction('expense', 1500, '食費', 'ランチ代')

// タブナビゲーション
cy.navigateToTab('calendar')
```

## テストファイルの書き方

### 基本構造
```typescript
describe('機能名', () => {
  beforeEach(() => {
    cy.cleanTestData()
    // 必要に応じてテストデータ準備
  })

  it('テストケース名', () => {
    cy.visit('/')
    
    // テスト操作
    cy.get('[data-testid="target-element"]').click()
    
    // アサーション
    cy.get('[data-testid="result"]').should('be.visible')
  })
})
```

### data-testid を使用した要素取得
```typescript
// 推奨：data-testid 属性を使用
cy.get('[data-testid="email-input"]')
cy.get('[data-testid="login-button"]')
cy.get('[data-testid="tab-navigation"]')

// 必要に応じてテキストでの要素取得
cy.contains('ログイン')
```

### アサーション例
```typescript
// 要素の表示確認
cy.get('[data-testid="header"]').should('be.visible')

// テキスト内容確認
cy.get('[data-testid="title"]').should('contain', 'カレンダー')

// URL確認
cy.url().should('include', '/auth')
cy.url().should('not.include', '/auth')

// クラス確認
cy.get('[data-testid="tab-calendar"]').should('have.class', 'bg-pink-50')

// HTML5バリデーション確認
cy.get('[data-testid="email-input"]:invalid').should('exist')
```

### 待機処理
```typescript
// タイムアウトを指定した要素待機
cy.get('[data-testid="error-message"]', { timeout: 10000 }).should('be.visible')

// ネットワークリクエストの待機（必要に応じて）
cy.intercept('POST', '/api/login').as('loginRequest')
cy.wait('@loginRequest')
```

### セッション管理
```typescript
// セッションを使用したログイン状態の保持
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.session([email, password], () => {
    // ログイン処理
  })
})
```

## テストデータ管理

### fixtures/test-transactions.json
```json
{
  "expenses": [
    {
      "amount": 1500,
      "category": "食費",
      "memo": "ランチ代",
      "date": "2024-01-15"
    }
  ],
  "income": [
    {
      "amount": 50000,
      "category": "給与",
      "memo": "月給", 
      "date": "2024-01-01"
    }
  ],
  "categories": {
    "expense": ["食費", "交通費", "光熱費"],
    "income": ["給与", "副業", "その他"]
  }
}
```

## ベストプラクティス

### 1. 要素の取得
- `data-testid` 属性を最優先に使用
- CSSセレクタに依存しない
- 意味のある属性名を使用

### 2. テストの独立性
- 各テスト前にデータをクリーンアップ
- テスト間での状態の共有を避ける
- `beforeEach` でセットアップ

### 3. 待機処理
- 明示的な待機を使用
- 適切なタイムアウト設定
- `cy.wait()` よりアサーションによる待機を優先

### 4. テストの構成
- 1つのテストケースに1つの機能
- 分かりやすいテストケース名
- 適切なグルーピング（`describe`）

### 5. 認証とセッション
- `cy.session()` を使用してログイン状態を効率的に管理
- テスト用アカウントを別途用意

## 注意事項

### 現在の制限事項
- Supabase認証の実装が未完了のため、一部テストは失敗が予想される
- 認証が必要な機能のテストはスキップまたはコメントアウト済み
- 実際のデータベース操作は含まれていない

### 今後の改善予定
- 認証機能実装後のテスト有効化
- 実際のSupabase APIとの統合
- テストデータのシード/クリーンアップ機能

### トラブルシューティング
- テストが失敗した場合はスクリーンショットを確認
- `cypress/screenshots/` ディレクトリに保存される
- タイムアウトエラーの場合は待機時間の調整を検討

## 関連ファイル

- [`cypress.config.ts`](./cypress.config.ts): Cypress設定
- [`cypress/e2e/auth.cy.ts`](./cypress/e2e/auth.cy.ts): 認証テスト
- [`cypress/e2e/navigation.cy.ts`](./cypress/e2e/navigation.cy.ts): ナビゲーションテスト
- [`cypress/support/commands.ts`](./cypress/support/commands.ts): カスタムコマンド定義
- [`package.json`](./package.json): npmスクリプト定義