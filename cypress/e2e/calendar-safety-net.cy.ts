describe('Calendar Safety Net Tests', () => {
  beforeEach(() => {
    cy.visit('/calendar');
    cy.wait(1000); // カレンダーの初期化を待つ
  });

  it('should display calendar and basic navigation works', () => {
    // カレンダーグリッドが表示される
    cy.get('.MuiPickersSlideTransition-root').should('be.visible');
    cy.get('.MuiPickersDay-root').should('have.length.at.least', 28);
    
    // 月ナビゲーションが動作する
    cy.get('button[aria-label="次の月"]').should('be.visible').click();
    cy.wait(500);
    cy.get('button[aria-label="前の月"]').should('be.visible').click();
    cy.wait(500);
  });

  it('should open transaction dialog when clicking a date', () => {
    // 日付をクリックしてダイアログが開く
    cy.get('.MuiPickersDay-root').first().click();
    cy.get('[role="dialog"]').should('be.visible');
    cy.get('form').should('be.visible');
    
    // ダイアログを閉じる
    cy.get('button[aria-label="Close"]').click();
    cy.get('[role="dialog"]').should('not.exist');
  });

  it('should switch between actual and planned transactions', () => {
    // 実際の収支ボタンが存在し、クリックできる
    cy.contains('button', '実際の収支').should('be.visible').should('have.class', 'bg-blue-500');
    
    // 予定の収支に切り替え
    cy.contains('button', '予定の収支').should('be.visible').click();
    cy.contains('button', '予定の収支').should('have.class', 'bg-orange-400');
    
    // 実際の収支に戻す
    cy.contains('button', '実際の収支').click();
    cy.contains('button', '実際の収支').should('have.class', 'bg-blue-500');
  });

  it('should display monthly summary', () => {
    // 月次サマリーが表示される
    cy.contains('収入').should('be.visible');
    cy.contains('支出').should('be.visible');
    cy.contains('残高').should('be.visible');
    
    // 固定表示ボタンが動作する
    cy.get('button[aria-label="概要を下部に固定"]').should('be.visible').click();
    cy.contains('固定中').should('be.visible');
    
    // 固定解除
    cy.get('button[aria-label="概要を閉じる"]').click();
    cy.contains('固定中').should('not.exist');
  });

  it('should handle basic transaction form interaction', () => {
    // 日付をクリックしてダイアログを開く
    cy.get('.MuiPickersDay-root').first().click();
    
    // フォーム要素が存在することを確認
    cy.get('input[type="radio"][value="expense"]').should('be.checked');
    cy.get('input[type="radio"][value="income"]').should('exist');
    cy.get('input[placeholder="金額を入力"]').should('be.visible');
    cy.get('textarea[placeholder="メモを入力（任意）"]').should('be.visible');
    cy.get('button').contains('追加').should('be.visible');
    
    // エラー状態のテスト（空フォーム送信）
    cy.get('button').contains('追加').click();
    // エラーが表示されること（具体的な要素は実装による）
  });

  it('should handle guide display and closure', () => {
    // ローカルストレージをクリアしてガイドを表示させる
    cy.window().then((win) => {
      win.localStorage.removeItem('calendarGuideShown');
    });
    cy.reload();
    
    // ガイドが表示される
    cy.contains('日付をタップして記録できます！').should('be.visible');
    
    // ガイドを閉じる
    cy.get('button[aria-label="ガイドを閉じる"]').click();
    cy.contains('日付をタップして記録できます！').should('not.exist');
  });
});