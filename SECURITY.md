# セキュリティガイド

## 🔒 実装されているセキュリティ対策

### 1. 認証・認可
- **Supabase認証**: 安全な認証プロバイダーを使用
- **パスワード強度チェック**: 最低6文字、推奨は8文字以上で複数文字種
- **入力値サニタイゼーション**: XSS攻撃防止のための入力値検証
- **メールアドレス検証**: 正規表現による形式チェック

### 2. フロントエンド セキュリティ
- **XSS対策**: `dangerouslySetInnerHTML`の使用箇所でCSS値のサニタイゼーション
- **入力値検証**: 全ての入力フィールドで検証とエスケープ
- **セキュリティヘッダー**: X-Content-Type-Options、X-Frame-Options、Referrer Policy
- **HTTPS強制**: 本番環境ではHTTPSのみ使用

### 3. 環境設定
- **環境変数管理**: 機密情報を環境変数で管理
- **設定ファイル分離**: 開発・テスト・本番環境の設定を分離
- **デモモード制限**: 開発環境でのみデモモードを許可

### 4. ログ・監視
- **セキュアログ**: 本番環境では機密情報をマスク
- **ログレベル制御**: 環境に応じたログレベルの調整
- **エラーハンドリング**: 詳細なエラー情報の適切な制御

## 🚨 セキュリティ警告

### 重大な問題（修正済み）
1. ~~**XSS脆弱性**: dangerouslySetInnerHTML の不適切な使用~~ ✅修正完了
2. ~~**環境変数漏洩**: .env ファイルの機密情報露出~~ ✅修正完了
3. ~~**認証バイパス**: 本番環境での不適切な認証スキップ~~ ✅修正完了

### 現在の制限事項
1. **Supabase設定**: 有効なSupabaseプロジェクトが必要
2. **HTTPS設定**: 本番環境でのHTTPS設定が必要
3. **CSP設定**: Content Security Policyの実装推奨

## 🛡️ セキュリティベストプラクティス

### 開発環境
```bash
# 環境変数を設定
cp .env.example .env
# 必要な値を設定

# セキュリティチェック実行
npm run security:check  # 将来実装予定
```

### 本番環境
```bash
# 環境変数をサーバーで設定
export VITE_SUPABASE_URL="https://your-project.supabase.co"
export VITE_SUPABASE_ANON_KEY="your_anon_key"
export VITE_ENVIRONMENT="production"

# .envファイルを削除
rm .env

# デモモードを無効化
export VITE_DEMO_MODE="false"
```

## 📋 セキュリティチェックリスト

### デプロイ前チェック
- [ ] .envファイルが本番環境に含まれていない
- [ ] デモモードが無効になっている
- [ ] 全ての機密情報が環境変数で管理されている
- [ ] HTTPSが有効になっている
- [ ] セキュリティヘッダーが設定されている
- [ ] ログに機密情報が含まれていない

### 定期チェック
- [ ] 依存関係の脆弱性スキャン
- [ ] Supabaseキーのローテーション
- [ ] アクセスログの監視
- [ ] エラーログの確認

## 🔧 セキュリティ設定

### Supabase設定
```sql
-- Row Level Security (RLS) ポリシーの例
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their own transactions"
ON transactions FOR ALL
TO authenticated
USING (auth.uid() = user_id);
```

### Webサーバー設定（例：Nginx）
```nginx
server {
    # セキュリティヘッダー
    add_header X-Frame-Options "DENY";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
    
    # CSP設定
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co";
}
```

## 🚨 インシデント対応

### 脆弱性を発見した場合
1. 即座に開発チームに報告
2. 影響範囲の特定
3. 緊急パッチの適用
4. セキュリティログの確認
5. 再発防止策の実装

### 連絡先
- 開発チーム: [開発者メール]
- セキュリティ責任者: [責任者メール]

## 📚 参考資料

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [React Security Best Practices](https://snyk.io/blog/10-react-security-best-practices/)

---

**最終更新**: 2025年9月3日  
**次回レビュー予定**: 2025年12月3日