# SEO検索サジェストツール - デプロイ手順

このドキュメントでは、SEO検索サジェストツールをVercel（フロントエンド）とRender（バックエンド）に無料でデプロイする手順を説明します。

## 前提条件

- GitHubアカウント
- Vercelアカウント（無料）
- Renderアカウント（無料）

## 1. バックエンドのデプロイ (Render)

1. [Render](https://render.com/)にアクセスし、GitHubアカウントでログインします。
2. ダッシュボードから「New +」→「Web Service」を選択します。
3. GitHubリポジトリのリストから該当リポジトリを選択します。
4. 以下の設定を行います：
   - Name: `seo-suggest-tool-api`（または任意の名前）
   - Environment: `Node`
   - Region: 最も近い地域を選択
   - Branch: `main`
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: `Free`

5. 「Advanced」セクションを開き、以下の環境変数を追加します：
   - `PORT`: `10000`
   - `NODE_ENV`: `production`
   - `CORS_ORIGIN`: VercelのフロントエンドのURL（後で更新）

6. 「Create Web Service」ボタンをクリックしてデプロイを開始します。
7. デプロイが完了すると、RenderはサービスのURLを提供します（例：`https://seo-suggest-tool-api.onrender.com`）。

## 2. フロントエンドのデプロイ (Vercel)

1. [Vercel](https://vercel.com/)にアクセスし、GitHubアカウントでログインします。
2. 「New Project」をクリックします。
3. GitHubリポジトリのリストから該当リポジトリを選択します。
4. 以下の設定を行います：
   - Framework Preset: Next.js
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

5. 「Environment Variables」セクションで以下の変数を追加します：
   - `NEXT_PUBLIC_API_URL`: バックエンドAPIのURL（Renderから取得したURL）

6. 「Deploy」ボタンをクリックしてデプロイを開始します。
7. デプロイが完了すると、VercelはプロジェクトのURLを提供します（例：`https://seo-suggest-tool.vercel.app`）。

## 3. 環境変数の更新

1. バックエンドデプロイ後、Renderダッシュボードでバックエンドプロジェクトの環境変数を更新します：
   - `CORS_ORIGIN`: VercelのフロントエンドURL

2. 変更を反映させるために、Renderダッシュボードの「Manual Deploy」→「Deploy latest commit」をクリックして再デプロイします。

## 4. 動作確認

1. ブラウザでVercelのフロントエンドURL（例：`https://seo-suggest-tool.vercel.app`）にアクセスします。
2. 検索フォームにキーワードを入力して検索します。
3. 結果が正しく表示されることを確認します。

## 5. 注意点

### Renderの無料プランの制限

- 使用していない時はスリープ状態（初回アクセス時に起動に15-30秒かかる）
- 月間750時間の実行時間
- 512MB RAM

### Vercelの無料プランの制限

- 帯域幅: 月間100GB
- ビルド時間: 月間6000分
- サーバーレス関数の実行時間: 月間100時間

### 対策

- フロントエンドに定期的なpingを設定して、バックエンドをアクティブに保つ（すでに実装済み）
- キャッシュを効果的に活用する
- 画像の最適化を行う 