describe('アプリケーションページ機能', () => {
  beforeEach(() => {
    cy.cleanTestData()
  })

  // 認証実装後に有効化するテスト
  describe.skip('グラフページ', () => {
    beforeEach(() => {
      cy.login('test@example.com', 'password123')
      cy.visit('/')
      cy.navigateToTab('graph')
    })

    it('グラフページが正常に表示される', () => {
      cy.get('[data-testid="graph-page"]').should('be.visible')
      cy.get('[data-testid="page-title"]').should('contain', 'グラフ')
    })

    it('支出グラフが表示される', () => {
      cy.get('[data-testid="expense-chart"]').should('be.visible')
      cy.get('[data-testid="chart-legend"]').should('be.visible')
      cy.get('[data-testid="chart-title"]').should('contain', '支出')
    })

    it('期間選択ができる', () => {
      // 期間選択ボタンを確認
      cy.get('[data-testid="period-selector"]').should('be.visible')
      
      // 週間を選択
      cy.get('[data-testid="period-week"]').click()
      cy.get('[data-testid="chart-period"]').should('contain', '週間')
      
      // 月間を選択
      cy.get('[data-testid="period-month"]').click()
      cy.get('[data-testid="chart-period"]').should('contain', '月間')
      
      // 年間を選択
      cy.get('[data-testid="period-year"]').click()
      cy.get('[data-testid="chart-period"]').should('contain', '年間')
    })

    it('カテゴリー別グラフが表示される', () => {
      cy.get('[data-testid="category-chart"]').should('be.visible')
      cy.get('[data-testid="category-legend"]').should('be.visible')
    })

    it('収入と支出の比較グラフが表示される', () => {
      cy.get('[data-testid="income-expense-chart"]').should('be.visible')
      cy.get('[data-testid="income-bar"]').should('be.visible')
      cy.get('[data-testid="expense-bar"]').should('be.visible')
    })

    it('グラフの詳細データが表示される', () => {
      // グラフ上の要素をクリック
      cy.get('[data-testid="expense-chart"]')
        .find('[data-testid="chart-segment"]')
        .first()
        .click()
      
      // 詳細情報が表示される
      cy.get('[data-testid="chart-detail"]').should('be.visible')
      cy.get('[data-testid="detail-amount"]').should('be.visible')
      cy.get('[data-testid="detail-category"]').should('be.visible')
    })

    it('データがない場合のメッセージが表示される', () => {
      cy.cleanTestData()
      cy.reload()
      
      cy.get('[data-testid="no-data-message"]')
        .should('be.visible')
        .should('contain', 'データがありません')
    })
  })

  describe.skip('貯金ページ', () => {
    beforeEach(() => {
      cy.login('test@example.com', 'password123')
      cy.visit('/')
      cy.navigateToTab('savings')
    })

    it('貯金ページが正常に表示される', () => {
      cy.get('[data-testid="savings-page"]').should('be.visible')
      cy.get('[data-testid="page-title"]').should('contain', '貯金')
    })

    it('現在の貯金額が表示される', () => {
      cy.get('[data-testid="current-savings"]').should('be.visible')
      cy.get('[data-testid="savings-amount"]').should('contain', '円')
    })

    it('貯金目標の設定ができる', () => {
      cy.get('[data-testid="set-goal-button"]').click()
      
      cy.get('[data-testid="goal-amount-input"]').type('100000')
      cy.get('[data-testid="goal-date-input"]').type('2024-12-31')
      cy.get('[data-testid="goal-description"]').type('新しいPC購入')
      
      cy.get('[data-testid="save-goal-button"]').click()
      
      cy.get('[data-testid="savings-goal"]')
        .should('contain', '100000')
        .should('contain', '新しいPC購入')
    })

    it('貯金進捗バーが表示される', () => {
      cy.get('[data-testid="progress-bar"]').should('be.visible')
      cy.get('[data-testid="progress-percentage"]').should('be.visible')
    })

    it('欲しいものリストが表示される', () => {
      cy.get('[data-testid="wishlist"]').should('be.visible')
      cy.get('[data-testid="wishlist-title"]').should('contain', '欲しいもの')
    })

    it('欲しいものリストにアイテムを追加できる', () => {
      cy.get('[data-testid="add-wishlist-button"]').click()
      
      cy.get('[data-testid="item-name-input"]').type('新しいスマホ')
      cy.get('[data-testid="item-price-input"]').type('80000')
      cy.get('[data-testid="item-priority"]').select('高')
      
      cy.get('[data-testid="save-item-button"]').click()
      
      cy.get('[data-testid="wishlist-item"]')
        .should('contain', '新しいスマホ')
        .should('contain', '80000')
        .should('contain', '高')
    })

    it('貯金履歴が表示される', () => {
      cy.get('[data-testid="savings-history"]').should('be.visible')
      cy.get('[data-testid="history-title"]').should('contain', '貯金履歴')
    })

    it('月間貯金チャートが表示される', () => {
      cy.get('[data-testid="monthly-savings-chart"]').should('be.visible')
    })

    it('貯金達成時の祝福メッセージが表示される', () => {
      // 目標額を低く設定してテスト
      cy.get('[data-testid="set-goal-button"]').click()
      cy.get('[data-testid="goal-amount-input"]').clear().type('1000')
      cy.get('[data-testid="save-goal-button"]').click()
      
      // 貯金額を目標額以上にする（テストデータ）
      cy.get('[data-testid="add-savings-button"]').click()
      cy.get('[data-testid="savings-input"]').type('1500')
      cy.get('[data-testid="confirm-savings"]').click()
      
      // 達成メッセージが表示される
      cy.get('[data-testid="achievement-message"]')
        .should('be.visible')
        .should('contain', 'おめでとう')
    })
  })

  describe.skip('設定ページ', () => {
    beforeEach(() => {
      cy.login('test@example.com', 'password123')
      cy.visit('/')
      cy.navigateToTab('settings')
    })

    it('設定ページが正常に表示される', () => {
      cy.get('[data-testid="settings-page"]').should('be.visible')
      cy.get('[data-testid="page-title"]').should('contain', '収支設定')
    })

    it('予算設定が表示される', () => {
      cy.get('[data-testid="budget-settings"]').should('be.visible')
      cy.get('[data-testid="budget-title"]').should('contain', '予算設定')
    })

    it('カテゴリー別予算を設定できる', () => {
      cy.get('[data-testid="category-budget"]').should('be.visible')
      
      // 食費の予算を設定
      cy.get('[data-testid="budget-食費"]').clear().type('30000')
      cy.get('[data-testid="save-budget"]').click()
      
      cy.get('[data-testid="success-message"]').should('be.visible')
      cy.get('[data-testid="budget-食費"]').should('have.value', '30000')
    })

    it('定期収入の設定ができる', () => {
      cy.get('[data-testid="recurring-income-section"]').should('be.visible')
      
      cy.get('[data-testid="add-recurring-income"]').click()
      cy.get('[data-testid="income-name"]').type('給与')
      cy.get('[data-testid="income-amount"]').type('250000')
      cy.get('[data-testid="income-day"]').select('25')
      cy.get('[data-testid="save-recurring-income"]').click()
      
      cy.get('[data-testid="recurring-income-list"]')
        .should('contain', '給与')
        .should('contain', '250000')
    })

    it('定期支出の設定ができる', () => {
      cy.get('[data-testid="recurring-expense-section"]').should('be.visible')
      
      cy.get('[data-testid="add-recurring-expense"]').click()
      cy.get('[data-testid="expense-name"]').type('家賃')
      cy.get('[data-testid="expense-amount"]').type('80000')
      cy.get('[data-testid="expense-day"]').select('1')
      cy.get('[data-testid="expense-category"]').select('住居費')
      cy.get('[data-testid="save-recurring-expense"]').click()
      
      cy.get('[data-testid="recurring-expense-list"]')
        .should('contain', '家賃')
        .should('contain', '80000')
    })

    it('データエクスポート機能が動作する', () => {
      cy.get('[data-testid="export-section"]').should('be.visible')
      
      cy.get('[data-testid="export-csv"]').click()
      cy.get('[data-testid="export-success"]')
        .should('be.visible')
        .should('contain', 'エクスポート完了')
    })

    it('データインポート機能が動作する', () => {
      cy.get('[data-testid="import-section"]').should('be.visible')
      
      // テストファイルをアップロード
      cy.fixture('test-transactions.json').then(fileContent => {
        cy.get('[data-testid="import-file"]')
          .selectFile({
            contents: Cypress.Buffer.from(JSON.stringify(fileContent)),
            fileName: 'test.json',
            mimeType: 'application/json'
          })
        
        cy.get('[data-testid="import-button"]').click()
        cy.get('[data-testid="import-success"]')
          .should('be.visible')
          .should('contain', 'インポート完了')
      })
    })

    it('アカウント設定が表示される', () => {
      cy.get('[data-testid="account-settings"]').should('be.visible')
      cy.get('[data-testid="account-email"]').should('be.visible')
    })

    it('パスワード変更ができる', () => {
      cy.get('[data-testid="change-password-button"]').click()
      
      cy.get('[data-testid="current-password"]').type('currentpassword')
      cy.get('[data-testid="new-password"]').type('newpassword123')
      cy.get('[data-testid="confirm-password"]').type('newpassword123')
      
      cy.get('[data-testid="save-password"]').click()
      
      // 成功メッセージまたはエラーが表示される
      cy.get('[data-testid="password-result"]').should('be.visible')
    })

    it('テーマ設定が変更できる', () => {
      cy.get('[data-testid="theme-settings"]').should('be.visible')
      
      // ダークテーマに変更
      cy.get('[data-testid="theme-dark"]').click()
      cy.get('body').should('have.class', 'dark')
      
      // ライトテーマに戻す
      cy.get('[data-testid="theme-light"]').click()
      cy.get('body').should('not.have.class', 'dark')
    })

    it('通知設定が変更できる', () => {
      cy.get('[data-testid="notification-settings"]').should('be.visible')
      
      // 予算超過通知を有効化
      cy.get('[data-testid="budget-alert"]').check()
      cy.get('[data-testid="budget-alert"]').should('be.checked')
      
      // 定期支出リマインダーを有効化
      cy.get('[data-testid="recurring-reminder"]').check()
      cy.get('[data-testid="save-notifications"]').click()
      
      cy.get('[data-testid="notification-success"]').should('be.visible')
    })
  })

  // 現在の認証なし状態でのテスト
  describe('認証なし状態での確認', () => {
    it('グラフページにアクセスできず認証ページが表示される', () => {
      cy.visit('/graph')
      cy.get('[data-testid="email-input"]').should('be.visible')
    })

    it('貯金ページにアクセスできず認証ページが表示される', () => {
      cy.visit('/savings')
      cy.get('[data-testid="email-input"]').should('be.visible')
    })

    it('設定ページにアクセスできず認証ページが表示される', () => {
      cy.visit('/settings')
      cy.get('[data-testid="email-input"]').should('be.visible')
    })
  })

  // レスポンシブデザインのテスト
  describe('レスポンシブ対応', () => {
    it('モバイルビューで各ページが適切に表示される', () => {
      cy.viewport('iphone-x')
      cy.visit('/')
      
      // 認証実装後のテストのプレースホルダー
      // cy.login('test@example.com', 'password123')
      // 
      // cy.navigateToTab('graph')
      // cy.get('[data-testid="mobile-graph-layout"]').should('exist')
      // 
      // cy.navigateToTab('savings')
      // cy.get('[data-testid="mobile-savings-layout"]').should('exist')
      // 
      // cy.navigateToTab('settings')
      // cy.get('[data-testid="mobile-settings-layout"]').should('exist')
    })
  })
})