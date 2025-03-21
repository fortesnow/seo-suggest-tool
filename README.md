# SEO検索サジェストツール

GoogleとYahoo!の検索サジェストキーワードを取得するためのウェブアプリケーションです。

## 機能

- Googleの検索サジェストキーワードの取得
- Yahoo!の検索サジェストキーワードの取得
- キーワードのハイライト表示
- モバイルフレンドリーなレスポンシブデザイン

## 技術スタック

### フロントエンド
- Next.js（React）
- CSS Modules
- Axios

### バックエンド
- Node.js
- Express
- Axios
- CORS

## インストール方法

### 必要条件
- Node.js
- npm

### バックエンドのセットアップ

```bash
# バックエンドディレクトリに移動
cd backend

# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env  # サンプルがある場合
# .envファイルを編集してください

# 開発サーバーの起動
npm run dev
```

### フロントエンドのセットアップ

```bash
# フロントエンドディレクトリに移動
cd frontend

# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env.local  # サンプルがある場合
# .env.localファイルを編集してください

# 開発サーバーの起動
npm run dev
```

## デプロイ

このプロジェクトは、Vercel（フロントエンド）とRender（バックエンド）を使用して無料でデプロイできます。詳細な手順については、`deployment-manual.md`を参照してください。

## ライセンス

ISC
