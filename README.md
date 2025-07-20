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

## Storybookの活用方法（実践的な運用ガイド）

### 1. Storybookとは？
StorybookはUIコンポーネントを個別に開発・テスト・ドキュメント化できるツールです。デザイン・開発・QA・PMなど多職種でのUIレビューや仕様共有に活用されます。

### 2. セットアップ
1. 依存パッケージのインストール:
   ```bash
   npx storybook@latest init
   npm install
   ```
2. Storybookの起動:
   ```bash
   npm run storybook
   ```
   → http://localhost:6006 でUIカタログを確認できます。

### 3. ストーリーの書き方
- `src/components/`配下の各コンポーネントごとに`*.stories.tsx`ファイルを作成します。
- 例: `src/components/ui/button.stories.tsx`
- 各ストーリーは「バリエーション」「異常系」「組み合わせ」など実際の利用シーンを意識して記述します。
- デザイナーやQAと相談しながら、アクセシビリティやデザインガイドラインも反映しましょう。

### 4. レビュー・運用フロー
- 新規コンポーネントやUI修正時は必ずStorybookストーリーも追加・修正します。
- プルリクエストではStorybookのスクリーンショットや動作動画を添付し、UIレビューを実施します。
- デザイナー・QA・PMもStorybookでUI仕様を確認し、フィードバックを反映します。
- UIの回帰テストやビジュアルリグレッションテスト（Chromatic等）も推奨です。

### 5. ベストプラクティス
- **Atomic Design**や**Figma連携**を意識し、再利用性の高いストーリーを心がける
- アクセシビリティ（a11y）アドオンを有効化し、色覚・キーボード操作も確認
- Storybook DocsでコンポーネントのAPIや使用例も自動生成
- デザインシステムやUIガイドラインの「生きたドキュメント」として活用

---

Storybookは「UIの品質・開発効率・チーム連携」を高めるための重要なツールです。積極的に活用しましょう！

## Storybook運用・レビュー・自動テスト体制

### 運用ルール
- 新規UI/修正時は必ずStorybookストーリーも追加・修正すること
- PR時は該当ストーリーを必ず確認・修正し、UIの見た目・アクセシビリティ・レスポンシブもレビュー
- スクリーンショットや動画をPRに添付し、非エンジニアもレビュー参加

### PRレビュー観点
- Storybookストーリーが追加・修正されているか
- 正常系だけでなく異常系（エラー・ローディング・空・長文・多項目等）も網羅されているか
- a11y/viewportアドオンでアクセシビリティ・レスポンシブも確認

### Chromatic導入手順
1. [Chromatic](https://www.chromatic.com/)にサインアップし、プロジェクトを連携
2. プロジェクトルートで `npm install --save-dev chromatic`
3. プロジェクト設定画面でProject Tokenを取得
4. 手動アップロード例: `npx chromatic --project-token=<your-token>`
5. PRごとにUI差分が自動検出され、意図しない崩れを防止

### CI/CD（GitHub Actions例）
`.github/workflows/chromatic.yml`:
```yaml
name: 'Chromatic'
on:
  pull_request:
    branches: [main]
jobs:
  chromatic-deployment:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx chromatic --project-token=${{ secrets.CHROMATIC_PROJECT_TOKEN }}
```
- `CHROMATIC_PROJECT_TOKEN`はGitHubリポジトリのSecretsに登録

---

Storybook/Chromaticを活用し、UI品質・開発効率・チーム連携を最大化しましょう！

### 自動lint修正の仕組み

このプロジェクトでは、lintエラーを自動的に修正する仕組みが導入されています：

#### 1. Git Hooks（コミット時自動修正）
- コミット時に自動的にlintエラーを修正
- 修正できないエラーがある場合はコミットをブロック

#### 2. VSCode設定（保存時自動修正）
- ファイル保存時に自動的にlintエラーを修正
- `.vscode/settings.json`で設定済み

#### 3. CI/CD（GitHub Actions）
- プルリクエスト時に自動的にlintエラーを修正
- 修正内容を自動コミット

#### 4. 手動実行コマンド
```bash
# lintエラーをチェック
npm run lint

# lintエラーを自動修正
npm run lint:fix

# lintエラーを監視（ファイル変更時に自動実行）
npm run lint:watch
```

### 自動テストの仕組み

このプロジェクトでは、テストが自動的に実行される仕組みが導入されています：

#### 1. Git Hooks（コミット時自動テスト）
- コミット時に自動的にテストを実行
- テストが失敗した場合はコミットをブロック

#### 2. VSCode設定（保存時自動テスト）
- ファイル保存時に自動的にテストを実行
- `.vscode/settings.json`で設定済み

#### 3. CI/CD（GitHub Actions）
- プッシュ・プルリクエスト時に自動的にテストを実行
- テスト結果をPRにコメント
- カバレッジレポートを自動生成

#### 4. 手動実行コマンド
```bash
# テストを実行
npm run test:run

# テストカバレッジを確認
npm run test:coverage

# テストを監視（ファイル変更時に自動実行）
npm run test:watch

# CI全体を実行
npm run ci
```
