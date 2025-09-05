describe('カレンダー機能', () => {
  beforeEach(() => {
    cy.cleanTestData()
  })

  // 認証実装後に有効化するテスト
  describe.skip('認証後のカレンダー操作', () => {
    beforeEach(() => {
      cy.login('test@example.com', 'password123')
      cy.visit('/')
      cy.navigateToTab('calendar')
    })

    it('カレンダーページが正常に表示される', () => {
      // カレンダーの基本要素が表示される
      cy.get('[data-testid="calendar-view"]').should('be.visible')
      cy.get('[data-testid="calendar-header"]').should('be.visible')
      cy.get('[data-testid="month-navigation"]').should('be.visible')
      
      // 現在月が表示される
      const currentMonth = new Date().getMonth() + 1
      const currentYear = new Date().getFullYear()
      cy.get('[data-testid="current-month"]')
        .should('contain', `${currentYear}年${currentMonth}月`)
    })

    it('月切り替えナビゲーションが動作する', () => {
      // 次月ボタンをクリック
      cy.get('[data-testid="next-month-button"]').click()
      
      // 月表示が変更されることを確認
      cy.get('[data-testid="current-month"]').should('not.contain', '1月')
      
      // 前月ボタンをクリック
      cy.get('[data-testid="prev-month-button"]').click()
      
      // 元の月に戻ることを確認
      cy.get('[data-testid="current-month"]').should('be.visible')
    })

    it('カレンダーの日付セルが正常に表示される', () => {
      // 日付セルが表示される
      cy.get('[data-testid="calendar-day"]').should('have.length.at.least', 28)
      
      // 今日の日付がハイライトされる
      const today = new Date().getDate()
      cy.get(`[data-testid="calendar-day-${today}"]`)
        .should('have.class', 'today')
        .or('have.class', 'bg-pink-100')
    })

    it('日付をクリックして取引追加フォームが表示される', () => {
      // 日付セルをクリック
      cy.get('[data-testid="calendar-day"]').first().click()
      
      // クイック取引フォームが表示される
      cy.get('[data-testid="quick-transaction-form"]').should('be.visible')
      cy.get('[data-testid="transaction-date"]').should('be.visible')
      cy.get('[data-testid="amount-input"]').should('be.visible')
      cy.get('[data-testid="category-select"]').should('be.visible')
    })

    it('カレンダーから取引を追加できる', () => {
      // 特定の日付をクリック
      cy.get('[data-testid="calendar-day-15"]').click()
      
      // 取引フォームに入力
      cy.get('[data-testid="transaction-type"]').click()
      cy.get('[data-value="expense"]').click()
      cy.get('[data-testid="amount-input"]').type('1200')
      cy.get('[data-testid="category-select"]').click()
      cy.get('[data-value="食費"]').click()
      cy.get('[data-testid="memo-input"]').type('ランチ代')
      
      // 追加ボタンをクリック
      cy.get('[data-testid="add-transaction-button"]').click()
      
      // 成功メッセージが表示される
      cy.get('[data-testid="success-message"]').should('be.visible')
      
      // カレンダーに戻り、該当日に取引が表示される
      cy.get('[data-testid="calendar-day-15"]')
        .should('contain', '1200')
        .should('contain', '食費')
    })

    it('日別の取引合計が表示される', () => {
      // テスト用取引を複数追加
      cy.get('[data-testid="calendar-day-10"]').click()
      cy.addTransaction('expense', 1000, '食費', '朝食')
      
      cy.get('[data-testid="calendar-day-10"]').click()
      cy.addTransaction('expense', 1500, '食費', 'ランチ')
      
      // 日別合計が表示される
      cy.get('[data-testid="calendar-day-10"]')
        .find('[data-testid="daily-total"]')
        .should('contain', '2500')
    })

    it('取引タイプ別に色分けして表示される', () => {
      // 支出取引を追加
      cy.get('[data-testid="calendar-day-20"]').click()
      cy.addTransaction('expense', 1000, '食費', '支出取引')
      
      // 収入取引を追加
      cy.get('[data-testid="calendar-day-20"]').click()
      cy.addTransaction('income', 5000, '給与', '収入取引')
      
      // 支出は赤系、収入は青系で表示される
      cy.get('[data-testid="calendar-day-20"]')
        .find('[data-testid="expense-item"]')
        .should('have.class', 'text-red-600')
        .or('have.class', 'bg-red-50')
      
      cy.get('[data-testid="calendar-day-20"]')
        .find('[data-testid="income-item"]')
        .should('have.class', 'text-blue-600')
        .or('have.class', 'bg-blue-50')
    })

    it('取引詳細をクリックして編集できる', () => {
      // 取引を追加
      cy.get('[data-testid="calendar-day-25"]').click()
      cy.addTransaction('expense', 800, '交通費', '電車代')
      
      // 取引詳細をクリック
      cy.get('[data-testid="calendar-day-25"]')
        .find('[data-testid="transaction-item"]')
        .click()
      
      // 編集フォームが表示される
      cy.get('[data-testid="edit-transaction-form"]').should('be.visible')
      cy.get('[data-testid="edit-amount-input"]').should('have.value', '800')
      cy.get('[data-testid="edit-memo-input"]').should('have.value', '電車代')
      
      // 値を変更して保存
      cy.get('[data-testid="edit-amount-input"]').clear().type('900')
      cy.get('[data-testid="save-edit-button"]').click()
      
      // 変更が反映される
      cy.get('[data-testid="calendar-day-25"]')
        .should('contain', '900')
    })

    it('週間ビューと月間ビューを切り替えできる', () => {
      // 週間ビューボタンをクリック
      cy.get('[data-testid="week-view-button"]').click()
      
      // 週間ビューが表示される
      cy.get('[data-testid="week-view"]').should('be.visible')
      cy.get('[data-testid="week-navigation"]').should('be.visible')
      
      // 月間ビューに戻る
      cy.get('[data-testid="month-view-button"]').click()
      cy.get('[data-testid="calendar-view"]').should('be.visible')
    })

    it('今日ボタンで現在日に戻れる', () => {
      // 他の月に移動
      cy.get('[data-testid="next-month-button"]').click()
      cy.get('[data-testid="next-month-button"]').click()
      
      // 今日ボタンをクリック
      cy.get('[data-testid="today-button"]').click()
      
      // 現在月に戻る
      const currentMonth = new Date().getMonth() + 1
      const currentYear = new Date().getFullYear()
      cy.get('[data-testid="current-month"]')
        .should('contain', `${currentYear}年${currentMonth}月`)
      
      // 今日の日付がハイライトされる
      const today = new Date().getDate()
      cy.get(`[data-testid="calendar-day-${today}"]`)
        .should('have.class', 'today')
    })

    it('月間サマリーが表示される', () => {
      // テスト用データを追加
      cy.seedTestData()
      
      // 月間サマリーが表示される
      cy.get('[data-testid="monthly-summary"]').should('be.visible')
      cy.get('[data-testid="monthly-income"]').should('be.visible')
      cy.get('[data-testid="monthly-expense"]').should('be.visible')
      cy.get('[data-testid="monthly-balance"]').should('be.visible')
      
      // 数値が正しく表示される
      cy.get('[data-testid="monthly-income"]').should('contain', '円')
      cy.get('[data-testid="monthly-expense"]').should('contain', '円')
    })

    it('カテゴリー別でフィルタリングできる', () => {
      // 複数カテゴリーの取引を追加
      cy.get('[data-testid="calendar-day-5"]').click()
      cy.addTransaction('expense', 1000, '食費', '食費取引')
      
      cy.get('[data-testid="calendar-day-6"]').click()
      cy.addTransaction('expense', 500, '交通費', '交通費取引')
      
      // カテゴリーフィルターを適用
      cy.get('[data-testid="category-filter"]').click()
      cy.get('[data-testid="filter-食費"]').click()
      
      // 食費のみ表示される
      cy.get('[data-testid="calendar-day-5"]').should('contain', '食費取引')
      cy.get('[data-testid="calendar-day-6"]').should('not.contain', '交通費取引')
      
      // フィルターをクリア
      cy.get('[data-testid="clear-filter"]').click()
      cy.get('[data-testid="calendar-day-6"]').should('contain', '交通費取引')
    })
  })

  // 現在の認証なし状態でのテスト
  describe('認証なし状態での確認', () => {
    it('カレンダーページにアクセスできず認証ページが表示される', () => {
      cy.visit('/calendar')
      
      // 認証ページにリダイレクトまたは認証フォームが表示される
      cy.get('[data-testid="email-input"]').should('be.visible')
      
      // カレンダー要素は表示されない
      cy.get('[data-testid="calendar-view"]').should('not.exist')
    })
  })

  // レスポンシブデザインのテスト
  describe('レスポンシブ対応', () => {
    it('モバイルビューでカレンダーが適切に表示される', () => {
      cy.viewport('iphone-x')
      cy.visit('/')
      
      // 認証実装後のテストのプレースホルダー
      // cy.login('test@example.com', 'password123')
      // cy.navigateToTab('calendar')
      // cy.get('[data-testid="calendar-view"]').should('be.visible')
      // cy.get('[data-testid="mobile-calendar-layout"]').should('exist')
    })

    it('タブレットビューでカレンダーが適切に表示される', () => {
      cy.viewport('ipad-2')
      cy.visit('/')
      
      // 認証実装後のテストのプレースホルダー
      // cy.login('test@example.com', 'password123')
      // cy.navigateToTab('calendar')
      // cy.get('[data-testid="calendar-view"]').should('be.visible')
    })
  })
})