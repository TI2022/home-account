# TTHomeAccount

家計簿管理アプリケーション。日々の収支を記録し、支出の傾向を分析することができます。

## 機能

- 収支の記録と管理
- カテゴリー別の支出分析
- 月次・年次の収支レポート
- データの永続化（Supabase）

## 技術スタック

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Radix UI
- Supabase
- Zustand (状態管理)

## 開発環境のセットアップ

### 必要条件

- Node.js (v18以上)
- npm (v8以上)

### インストール手順

1. リポジトリをクローン
```bash
git clone [リポジトリURL]
cd TTHomeAccount
```

2. 依存関係のインストール
```bash
npm install
```

3. 開発サーバーの起動
```bash
npm run dev
```

4. ブラウザで以下のURLにアクセス
```
http://localhost:5173
```

### その他のコマンド

- ビルド: `npm run build`
- プレビュー: `npm run preview`
- リント: `npm run lint`

## 環境変数の設定

`.env` ファイルを作成し、以下の環境変数を設定してください：

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## ライセンス

[ライセンス情報を記載]
