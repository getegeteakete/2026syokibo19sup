# 🏢 小規模事業者持続化補助金 サポートシステム

小規模事業者持続化補助金（第19回・一般型）の申請から実績報告まで一気通貫でサポートする管理システムです。

## ✨ 主な機能

- 🔐 **マルチユーザー認証** — 管理者がID/PASSを作成、顧客がログイン
- ⏰ **カウントダウンタイマー** — 申請締切・様式4締切までをリアルタイム表示
- 💬 **AIチャット（4種類）** — 総合相談・ヒアリング・申請書作成・電子申請ガイド
- 📷 **画像添付対応** — スクリーンショットを送ってAIに申請画面の操作を聞ける
- 📝 **ヒアリングフォーム** — 会社情報から事業計画まで詳細入力
- 💰 **補助額シミュレーション** — 経費を入力するだけで自動試算
- ✅ **申請要件チェック** — GビズID・商工会議所・書類確認
- 📂 **必要書類チェックリスト** — 準備状況を視覚的に管理
- 📅 **スケジュール管理** — 全体のマイルストーンを一覧表示
- 📊 **実績報告ガイド** — 採択後の手続きをステップガイド
- 👥 **管理者パネル** — 全顧客の状況・ヒアリングデータ・ステータス管理
- 🔢 **トークン使用量管理** — 顧客ごとの制限・リセット機能

## 🚀 セットアップ手順

### 1. リポジトリのクローン

```bash
git clone <your-repo-url>
cd hojokin-kanri
npm install
```

### 2. データベースの準備

**Neon（無料PostgreSQL）の利用を推奨：**
1. https://neon.tech にアクセスし、無料アカウント作成
2. 新しいプロジェクトを作成
3. 接続文字列をコピー（`postgresql://...`形式）

### 3. 環境変数の設定

```bash
cp .env.example .env
```

`.env`を編集：

```env
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
JWT_SECRET="ランダムな長い文字列（32文字以上推奨）"
ANTHROPIC_API_KEY="sk-ant-..."
```

### 4. データベースの初期化

```bash
npm run db:push    # スキーマを適用
npm run db:seed    # 管理者アカウントを作成
```

### 5. 開発サーバー起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開く

**初期管理者アカウント:**
- ユーザーID: `admin`
- パスワード: `admin1234`

⚠️ 本番環境では必ずパスワードを変更してください！

## 🌐 Vercelへのデプロイ

### 方法1: GitHub経由（推奨）

1. GitHubにリポジトリを作成しプッシュ：
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/あなたのユーザー名/hojokin-kanri.git
git push -u origin main
```

2. https://vercel.com にアクセス
3. "Import Project" → GitHubリポジトリを選択
4. 環境変数を設定（Settings > Environment Variables）：
   - `DATABASE_URL` — NeonのDB接続文字列
   - `JWT_SECRET` — ランダムな文字列
   - `ANTHROPIC_API_KEY` — AnthropicのAPIキー
5. Deploy！

### 方法2: Vercel CLI

```bash
npm i -g vercel
vercel
# 指示に従って環境変数を設定
```

## 📁 プロジェクト構成

```
hojokin-kanri/
├── app/
│   ├── login/         # ログイン画面
│   ├── dashboard/     # 顧客ポータル
│   │   ├── page.tsx         # ホーム（カウントダウン・進捗）
│   │   ├── chat/            # AIチャット（4モード）
│   │   ├── hearing/         # ヒアリングフォーム
│   │   ├── documents/       # 必要書類チェックリスト
│   │   ├── schedule/        # スケジュール
│   │   ├── reports/         # 実績報告
│   │   └── data/            # 登録データ確認
│   ├── admin/         # 管理者パネル
│   │   ├── page.tsx         # 管理ダッシュボード
│   │   ├── users/           # 顧客管理
│   │   ├── customer/[id]/   # 顧客詳細
│   │   └── tokens/          # トークン管理
│   └── api/           # APIルート
├── components/        # 共通コンポーネント
├── lib/               # ユーティリティ
│   ├── auth.ts        # JWT認証
│   ├── db.ts          # Prismaクライアント
│   └── constants.ts   # 補助金定数・ヒアリング定義
└── prisma/            # DB スキーマ
```

## 🔑 ユーザー管理

### 顧客の追加方法
1. 管理者でログイン（`/admin`）
2. 「顧客管理」→「新規顧客登録」
3. ID・パスワード・会社名を入力
4. 顧客に発行したID/PASSを通知

### 顧客の状況確認
- 管理ダッシュボードで全顧客の進捗を一覧表示
- 顧客詳細画面でヒアリングデータ・ステータス・チャット履歴を確認
- ステータスを手動で更新可能

## 💡 申請フロー

```
申請要件チェック
    ↓
補助額シミュレーション
    ↓
ヒアリング記入（AI支援）
    ↓
商工会議所 面談・様式4取得（〆切: 4/16）
    ↓
申請書類作成（AIで下書き）
    ↓
電子申請（Jグランツ、スクショAI対応）
    ↓
審査・採択発表（7月頃）
    ↓
交付決定
    ↓
補助事業実施
    ↓
実績報告（〆切: 2027/7/10）
    ↓
補助金交付
    ↓
事業効果報告（1年後）
```

## 📞 サポート

ご不明な点は担当者までご連絡ください。
