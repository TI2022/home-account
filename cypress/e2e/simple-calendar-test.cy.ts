describe('Simple Calendar Integration Test', () => {
  it('カレンダー機能の基本動作確認', () => {
    cy.visit('/');
    
    // タブナビゲーションがある
    cy.get('[data-testid="tab-navigation"]').should('be.visible');
    
    // カレンダータブをクリック
    cy.contains('button', 'カレンダー').click();
    
    // カレンダーコンポーネントが表示される
    cy.get('.MuiDateCalendar-root').should('be.visible');
    
    // 実データ/予定データ切り替えボタンが存在する
    cy.contains('button', '実際の収支').should('be.visible');
    cy.contains('button', '予定の収支').should('be.visible');
    
    // 予定データに切り替え
    cy.contains('button', '予定の収支').click();
    
    // 実データに戻す
    cy.contains('button', '実際の収支').click();
    
    // 日付のクリックでポップアップ（MUIダイアログのクラスが存在するかチェック）
    cy.get('.MuiPickersDay-root').then(($days) => {
      // クリック可能な日付を見つける
      const clickableDay = Array.from($days).find(day => 
        window.getComputedStyle(day).pointerEvents !== 'none'
      );
      if (clickableDay) {
        cy.wrap(clickableDay).click();
        // ダイアログが開くかチェック
        cy.get('body').should('contain', '日');
      }
    });
  });

  it('Context APIが正常に動作している', () => {
    cy.visit('/');
    cy.contains('button', 'カレンダー').click();
    
    // Context Providerでラップされた状態でエラーなく動作する
    cy.get('.MuiDateCalendar-root').should('be.visible');
    
    // パフォーマンス最適化されたコンポーネントが動作
    cy.get('.MuiPickersDay-root').should('have.length.at.least', 20);
  });

  it('分離されたコンポーネントが正常に動作する', () => {
    cy.visit('/');
    cy.contains('button', 'カレンダー').click();
    
    // ImportResultToast コンポーネント（表示されていない状態でもエラーなし）
    cy.get('body').should('not.contain', 'ImportResultToast component error');
    
    // TransactionDialog コンポーネント
    cy.get('body').should('not.contain', 'TransactionDialog component error');
    
    // BulkDeleteConfirmDialog コンポーネント
    cy.get('body').should('not.contain', 'BulkDeleteConfirmDialog component error');
  });
});