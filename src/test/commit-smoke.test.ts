import { describe, it, expect } from 'vitest';

/** pre-commit 用: Playwright / ブラウザを使わずに Vitest が通ることだけ確認 */
describe('commit smoke', () => {
  it('unit プロジェクトが実行できる', () => {
    expect(1 + 1).toBe(2);
  });
});
