describe('取引機能', () => {
  beforeEach(() => {
    cy.cleanTestData()
  })

  // 認証実装後に有効化するテスト  
  describe('認証後の取引操作（モック使用）', () => {
    beforeEach(() => {
      cy.login('test@example.com', 'password123')
      cy.visit('/')
    })

    it('支出取引を正常に追加できる', () => {
      // クイック取引フォームで支出を追加
      cy.addTransaction('expense', 1500, '食費', 'ランチ代')
      
      // 取引が追加されたことを確認
      cy.get('[data-testid="transaction-list"]')
        .should('contain', '1500')
        .should('contain', '食費')
        .should('contain', 'ランチ代')
    })

    it('収入取引を正常に追加できる', () => {
      // クイック取引フォームで収入を追加
      cy.addTransaction('income', 50000, '給与', '月給')
      
      // 取引が追加されたことを確認
      cy.get('[data-testid="transaction-list"]')
        .should('contain', '50000')
        .should('contain', '給与')
        .should('contain', '月給')
    })

    it('取引タイプを切り替えできる', () => {
      // 取引タイプセレクトを確認
      cy.get('[data-testid="transaction-type"]').should('be.visible')
      
      // 支出を選択
      cy.get('[data-testid="transaction-type"]').click()
      cy.get('[data-value="expense"]').click()
      cy.get('[data-testid="transaction-type"]').should('contain', '支出')
      
      // 収入に切り替え
      cy.get('[data-testid="transaction-type"]').click()
      cy.get('[data-value="income"]').click()
      cy.get('[data-testid="transaction-type"]').should('contain', '収入')
    })

    it('カテゴリーを選択できる', () => {
      // 支出カテゴリーのテスト
      cy.get('[data-testid="transaction-type"]').click()
      cy.get('[data-value="expense"]').click()
      
      cy.get('[data-testid="category-select"]').click()
      cy.get('[data-value="食費"]').should('be.visible')
      cy.get('[data-value="交通費"]').should('be.visible')
      cy.get('[data-value="光熱費"]').should('be.visible')
      
      // 食費を選択
      cy.get('[data-value="食費"]').click()
      cy.get('[data-testid="category-select"]').should('contain', '食費')
      
      // 収入カテゴリーのテスト
      cy.get('[data-testid="transaction-type"]').click()
      cy.get('[data-value="income"]').click()
      
      cy.get('[data-testid="category-select"]').click()
      cy.get('[data-value="給与"]').should('be.visible')
      cy.get('[data-value="副業"]').should('be.visible')
    })

    it('金額入力のバリデーションが動作する', () => {
      // 負の値は入力できない
      cy.get('[data-testid="amount-input"]').type('-100')
      cy.get('[data-testid="amount-input"]').should('not.have.value', '-100')
      
      // 0は入力できない
      cy.get('[data-testid="amount-input"]').clear().type('0')
      cy.get('[data-testid="submit-button"]').click()
      cy.get('[data-testid="amount-input"]:invalid').should('exist')
      
      // 正常な値は入力できる
      cy.get('[data-testid="amount-input"]').clear().type('1500')
      cy.get('[data-testid="amount-input"]').should('have.value', '1500')
    })

    it('メモ欄は任意項目として動作する', () => {
      // メモなしで取引追加
      cy.get('[data-testid="transaction-type"]').click()
      cy.get('[data-value="expense"]').click()
      cy.get('[data-testid="amount-input"]').type('1000')
      cy.get('[data-testid="category-select"]').click()
      cy.get('[data-value="食費"]').click()
      cy.get('[data-testid="submit-button"]').click()
      
      // メモなしでも取引が追加されることを確認
      cy.get('[data-testid="success-message"]').should('be.visible')
      
      // メモありで取引追加
      cy.get('[data-testid="memo-input"]').type('テストメモ')
      cy.get('[data-testid="submit-button"]').click()
      
      cy.get('[data-testid="transaction-list"]')
        .should('contain', 'テストメモ')
    })

    it('フォームリセット機能が動作する', () => {
      // フォームに入力
      cy.get('[data-testid="transaction-type"]').click()
      cy.get('[data-value="expense"]').click()
      cy.get('[data-testid="amount-input"]').type('1500')
      cy.get('[data-testid="category-select"]').click()
      cy.get('[data-value="食費"]').click()
      cy.get('[data-testid="memo-input"]').type('テストメモ')
      
      // リセットボタンをクリック
      cy.get('[data-testid="reset-button"]').click()
      
      // フォームがクリアされることを確認
      cy.get('[data-testid="amount-input"]').should('have.value', '')
      cy.get('[data-testid="memo-input"]').should('have.value', '')
    })

    it('取引履歴から取引を削除できる', () => {
      // 取引を追加
      cy.addTransaction('expense', 1500, '食費', 'テスト取引')
      
      // 取引が表示されることを確認
      cy.get('[data-testid="transaction-item"]')
        .contains('テスト取引')
        .should('be.visible')
      
      // 削除ボタンをクリック
      cy.get('[data-testid="transaction-item"]')
        .contains('テスト取引')
        .parent()
        .find('[data-testid="delete-button"]')
        .click()
      
      // 確認ダイアログで削除を確認
      cy.get('[data-testid="delete-confirm-button"]').click()
      
      // 取引が削除されることを確認
      cy.get('[data-testid="transaction-item"]')
        .contains('テスト取引')
        .should('not.exist')
    })

    it('取引履歴から取引を編集できる', () => {
      // 取引を追加
      cy.addTransaction('expense', 1500, '食費', 'テスト取引')
      
      // 編集ボタンをクリック
      cy.get('[data-testid="transaction-item"]')
        .contains('テスト取引')
        .parent()
        .find('[data-testid="edit-button"]')
        .click()
      
      // 編集フォームで値を変更
      cy.get('[data-testid="edit-amount-input"]').clear().type('2000')
      cy.get('[data-testid="edit-memo-input"]').clear().type('編集済みメモ')
      
      // 保存ボタンをクリック
      cy.get('[data-testid="save-button"]').click()
      
      // 変更が反映されることを確認
      cy.get('[data-testid="transaction-item"]')
        .should('contain', '2000')
        .should('contain', '編集済みメモ')
    })
  })

  // 現在の認証なし状態でのテスト
  describe('認証なし状態での確認', () => {
    it('認証ページが表示され、取引フォームにアクセスできない', () => {
      cy.visit('/')
      
      // 認証ページが表示される
      cy.get('[data-testid="email-input"]').should('be.visible')
      
      // 取引関連の要素は表示されない
      cy.get('[data-testid="transaction-type"]').should('not.exist')
      cy.get('[data-testid="amount-input"]').should('not.exist')
    })
  })

  // フィクスチャーデータを使用したテスト
  describe('テストデータでの動作確認', () => {
    it('フィクスチャーデータが正しく読み込まれる', () => {
      cy.fixture('test-transactions').then((transactions) => {
        expect(transactions.expenses).to.have.length.at.least(1)
        expect(transactions.income).to.have.length.at.least(1)
        expect(transactions.categories.expense).to.include('食費')
        expect(transactions.categories.income).to.include('給与')
      })
    })

    it('カテゴリーデータが正しい形式である', () => {
      cy.fixture('test-transactions').then((transactions) => {
        // 支出カテゴリーの確認
        transactions.categories.expense.forEach(category => {
          expect(category).to.be.a('string')
          expect(category.length).to.be.greaterThan(0)
        })
        
        // 収入カテゴリーの確認
        transactions.categories.income.forEach(category => {
          expect(category).to.be.a('string')
          expect(category.length).to.be.greaterThan(0)
        })
      })
    })
  })
})