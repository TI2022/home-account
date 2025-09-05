/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable<Subject = any> {
      /**
       * 認証APIのモック設定
       */
      setupAuthMock(): Chainable<Subject>
      
      /**
       * モックを使用したログイン
       * @param email メールアドレス
       * @param password パスワード
       */
      login(email: string, password: string): Chainable<Subject>
      
      /**
       * 認証をバイパスして直接ログイン状態にする
       */
      bypassAuth(): Chainable<Subject>
      
      /**
       * ログアウト操作
       */
      logout(): Chainable<Subject>
      
      /**
       * テスト用データの準備
       */
      seedTestData(): Chainable<Subject>
      
      /**
       * テスト用データの削除
       */
      cleanTestData(): Chainable<Subject>
      
      /**
       * 取引を追加する操作
       * @param type 取引タイプ（income/expense）
       * @param amount 金額
       * @param category カテゴリー
       * @param memo メモ（省略可）
       */
      addTransaction(
        type: 'income' | 'expense', 
        amount: number, 
        category: string, 
        memo?: string
      ): Chainable<Subject>
      
      /**
       * タブナビゲーションでページ移動
       * @param tabName タブ名（calendar/graph/savings/settings）
       */
      navigateToTab(tabName: 'calendar' | 'graph' | 'savings' | 'settings'): Chainable<Subject>
    }
  }
}

// モック認証設定
Cypress.Commands.add('setupAuthMock', () => {
  // Supabase認証APIをモック
  cy.intercept('POST', '**/auth/v1/token*', {
    statusCode: 200,
    body: {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      user: {
        id: 'mock-user-id',
        email: 'test@example.com',
        aud: 'authenticated',
        role: 'authenticated'
      }
    }
  }).as('authLogin')

  cy.intercept('GET', '**/auth/v1/user', {
    statusCode: 200,
    body: {
      id: 'mock-user-id',
      email: 'test@example.com',
      aud: 'authenticated',
      role: 'authenticated'
    }
  }).as('getUser')

  cy.intercept('POST', '**/auth/v1/logout', {
    statusCode: 200,
    body: {}
  }).as('authLogout')
})

// 簡単なログインコマンド（環境変数でモック有効化）
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.session([email, password], () => {
    // 環境変数を設定してテストモードを有効化
    Cypress.env('TEST_MODE', true)
    Cypress.env('MOCK_USER', {
      id: 'mock-user-id',
      email: email,
      aud: 'authenticated',
      role: 'authenticated'
    })
    
    cy.visit('/')
    
    // 認証状態を確認（メインページが表示される）
    cy.get('[data-testid="header"]', { timeout: 10000 }).should('be.visible')
  })
})

// より簡単な認証バイパス方法
Cypress.Commands.add('bypassAuth', () => {
  cy.window().then((win) => {
    // Zustandストアに直接ユーザー情報を設定
    const mockUser = {
      id: 'mock-user-id',
      email: 'test@example.com',
      aud: 'authenticated',
      role: 'authenticated'
    }
    
    // ウィンドウオブジェクトにモックユーザーを設定
    win.__MOCK_USER__ = mockUser
  })
  
  cy.visit('/')
})

// ログアウト
Cypress.Commands.add('logout', () => {
  // ヘッダーのログアウトボタンをクリック（実装に応じて調整）
  cy.get('[data-testid="logout-button"]').click()
  cy.url().should('include', '/auth')
})

// テストデータ準備
Cypress.Commands.add('seedTestData', () => {
  // 現在は基本的なデータ準備のプレースホルダー
  // 実際のSupabase APIとの統合は後で実装
  cy.log('テストデータを準備中...')
})

// テストデータ削除
Cypress.Commands.add('cleanTestData', () => {
  // 現在は基本的なデータ削除のプレースホルダー
  // 実際のSupabase APIとの統合は後で実装
  cy.log('テストデータを削除中...')
})

// 取引追加操作
Cypress.Commands.add('addTransaction', (type, amount, category, memo = '') => {
  // クイック取引フォームでの操作
  cy.get('[data-testid="transaction-type"]').click()
  cy.get(`[data-value="${type}"]`).click()
  
  cy.get('[data-testid="amount-input"]').clear().type(amount.toString())
  
  cy.get('[data-testid="category-select"]').click()
  cy.get(`[data-value="${category}"]`).click()
  
  if (memo) {
    cy.get('[data-testid="memo-input"]').type(memo)
  }
  
  cy.get('[data-testid="submit-button"]').click()
})

// タブナビゲーション
Cypress.Commands.add('navigateToTab', (tabName) => {
  cy.get(`[data-testid="tab-${tabName}"]`).click()
  
  // ページが切り替わったことを確認
  cy.get('[data-testid="tab-navigation"]')
    .find(`[data-testid="tab-${tabName}"]`)
    .should('have.class', 'bg-pink-50') // アクティブタブのスタイル
})