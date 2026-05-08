# Wellness Point System

従業員向け健康増進ポイント管理SaaS — Phase 6(マルチテナント版)

複数企業をターゲットに展開可能なマルチテナント型福利厚生ポイント管理システム。スーパー管理者が複数企業を一元管理し、各企業の管理者は自社のデータのみ閲覧できます。

## 機能

### 4つのロール

```
[スーパー管理者] — サービス提供者
   ↓ 全企業を統括管理
[企業内管理者]   — 各企業の人事担当(自社のみ閲覧可)
[従業員]         — 各企業の社員(残pt確認・予約)
[加盟店]         — 提携店舗(全社共通、利用実績登録)
```

### 従業員
- マイページ:残ポイント・利用率メーター・今月の利用額/件数
- 提携店舗・サービスメニュー一覧(各サービスに「店舗HPへ」ボタン)
- 各店舗の予約サイトを別タブで開く
- 利用履歴の閲覧

### 加盟店(全社共通)
- ダッシュボード:今月の利用ポイント・売上・利用件数・未確定取引数
- **利用実績の登録**(従業員来店後、加盟店が事後登録):
  - 従業員検索(氏名・社員ID)+ **会社フィルタ**(複数企業からまとめて選択)
  - 最近利用した従業員のハイライト
  - 残pt0は選択不可
  - サービス選択後、ポイント・自己負担を自動計算
- サービスメニューの追加・編集・削除
- **店舗情報の編集**:HP/予約サイトURL・住所
- 月次請求書の発行(適格請求書/インボイス制度対応・企業ごと)
- 請求書のCSV出力(取引明細・サマリ、UTF-8 BOM付きでExcel直接対応)

### 企業内管理者(自社のみ)
- 自社ダッシュボード:従業員数・利用ポイント・利用率・会社負担額
- 自社従業員別 利用状況一覧
- 自社の加盟店別 集計
- 自社の利用明細
- 自社の請求書一覧 + PDFダウンロード + CSV(明細・サマリ・月単位一括)

### スーパー管理者(全企業横断)
- ダッシュボード:全企業数・全従業員数・全加盟店数・今月総売上
- **企業管理**:企業の追加・編集(初期管理者を同時作成)
- **従業員管理**:全企業の従業員を会社フィルタで切り替えながら追加・編集
- **加盟店管理**:全社共通の加盟店を追加・編集(全企業との契約自動作成)
- **CSV一括インポート**:企業・従業員・加盟店をCSVで数百件単位で投入

## 技術スタック

- Next.js 14 (App Router) + TypeScript
- Auth.js v5 (Credentials Provider)
- Prisma + PostgreSQL
- bcryptjs (パスワードハッシュ)
- Zod (バリデーション)

## セットアップ手順

### 1. 前提環境

- Node.js 20.x 以上
- Docker Desktop または ローカルにPostgreSQL 16+

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

```bash
cp .env.example .env
```

`.env` の `AUTH_SECRET` をランダムな32文字以上の文字列に変更してください:

```bash
openssl rand -base64 32
```

### 4. PostgreSQL の起動

```bash
docker compose up -d
```

### 5. データベース初期化

```bash
npx prisma migrate dev --name init
npm run db:seed
```

シードによって以下が投入されます:
- 会社: 株式会社アクメ商事
- 従業員: 12名(全部署)
- 加盟店: 3店舗(ジム・ゴルフ・整体)+ サービスメニュー8件
- 当月の取引: 13件(確定・申請中含む)
- 当月のポイント付与レコード: 全従業員分

### 6. 開発サーバー起動

```bash
npm run dev
```

## デモアカウント

すべて パスワード `demo1234`(メールログイン専用)

| ロール | メール |
|---|---|
| **スーパー管理者** | super@wellness.example.jp |
| 企業内管理者(アクメ) | admin@acme.co.jp |
| 企業内管理者(グローブテック) | admin@globe-tech.co.jp |
| 従業員(アクメ) | tanaka@acme.co.jp |
| 従業員(グローブテック) | inoue@globe-tech.co.jp |
| 加盟店 | gym@fit-osaka.jp |

> シードでは2社(アクメ商事 12名・グローブテック 6名)+ 加盟店3店が登録されます。加盟店は全企業共通で利用可能です。

## 動作確認の流れ

1. **スーパー管理者で全体俯瞰** — `super@wellness.example.jp` でログイン
   - 企業数・従業員数・今月総売上が表示される
   - 「企業管理」→ 2社が一覧表示
   - 「従業員管理」→ 会社フィルタで切替できることを確認
   - 「加盟店管理」→ 3店舗とも全社契約済(契約社数: 2)
2. **企業内管理者で自社のみ確認** — `admin@acme.co.jp` でログイン
   - アクメ商事のデータのみ閲覧できる(グローブテックの情報は見えない)
3. **加盟店で利用実績登録(複数企業対応)** — `gym@fit-osaka.jp` でログイン → 「+ 実績を登録」
   - チップフィルタが「全企業 / アクメ商事 / グローブテック」と並ぶ
   - 検索バーで会社をまたいで従業員検索できる
   - 残pt0の従業員はクリック不可
4. **従業員で反映確認** — `tanaka@acme.co.jp` または `inoue@globe-tech.co.jp` でログイン
   - 残ptが減っているか、利用履歴に該当取引が表示されているか確認
5. **CSV一括インポートの確認** — スーパー管理者で `/superadmin/import` を開く
   - 企業・従業員・加盟店の3種類のフォーマットガイドが表示される
   - サンプルCSVをコピー&ペースト → ファイル化 → アップロードで動作確認
6. **請求書発行(企業ごと)** — `gym@fit-osaka.jp` でログイン → 「請求書を作成」
   - アクメ商事・グローブテック両社の請求書を別々に発行できる
   - PDF/CSVダウンロード可能
   - 「請求書一覧 →」で発行済みの請求書を確認・PDF再ダウンロード可能

## ポイント運用フロー

```
[従業員] マイページで店舗を選ぶ → [店舗HP] 予約サイトで予約
   ↓
[来店] サービスを利用
   ↓
[加盟店] ダッシュボードで対象従業員を検索 → ポイント利用を事後登録
   ↓
[従業員] マイページの残pt・利用履歴に反映
```

## 重要な仕様

### ポイント
- 1pt = 1,000円
- 月初に会社設定の月次pt(デフォルト5pt)が全従業員に付与
- 月末に失効、繰越なし
- サービス額の50%以内のみpt利用可能(残りは自己負担)

### 検証ロジック(50%ルール / 残pt)
クライアントとサーバー両方で検証されます:
- クライアント: `usage-register-modal.tsx` のステッパー上限制御
- サーバー: `/api/transactions` の Zod + `validatePoints()`
- 不正な値(負の値・残pt超過・50%超)はAPIで弾かれます
- ポイント利用の登録は加盟店のみ可能(従業員からのAPI呼び出しは403で拒否)

### マルチテナント分離
- 全クエリで `companyId` または `merchantId` でフィルタ
- 加盟店は会社との `MerchantContract` がないと取引できない
- 加盟店が見られる従業員は契約中の会社の従業員のみ

### 監査ログ
変更操作のみ記録(view系は記録しない):
- login_success / login_failed
- create_transaction / confirm_transaction / delete_transaction
- create_service / update_service / delete_service
- update_merchant
- issue_invoice

## プロジェクト構成

```
wellness-point-system/
├── prisma/
│   ├── schema.prisma           DB定義(9テーブル, merchant.website_url含む)
│   └── seed.ts                  デモデータ投入
├── src/
│   ├── middleware.ts            全ページ認証ガード
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── auth.ts              Auth.js v5
│   │   ├── auth-helpers.ts
│   │   ├── audit.ts
│   │   ├── validation.ts
│   │   ├── points.ts            pt計算ロジック
│   │   └── server/queries.ts    マルチテナント対応クエリ集
│   ├── app/
│   │   ├── login/
│   │   ├── employee/
│   │   │   └── page.tsx         マイページ(店舗HPボタン)
│   │   ├── merchant/
│   │   │   ├── page.tsx         ダッシュボード
│   │   │   ├── services/        メニュー管理
│   │   │   ├── profile/         店舗情報編集(URL等)
│   │   │   └── invoice/         請求書作成
│   │   ├── admin/
│   │   │   ├── page.tsx         全社ダッシュボード
│   │   │   └── invoices/        請求書一覧
│   │   └── api/
│   │       ├── auth/
│   │       ├── transactions/
│   │       ├── services/
│   │       ├── invoices/
│   │       └── merchants/       (employees, services, profile)
│   ├── components/
│   │   ├── login-form.tsx
│   │   ├── logout-button.tsx
│   │   └── shared/
│   │       ├── app-header.tsx
│   │       ├── styles.ts
│   │       ├── confirm-tx-button.tsx
│   │       ├── usage-register-button.tsx
│   │       ├── usage-register-modal.tsx
│   │       ├── service-manager.tsx
│   │       ├── profile-form.tsx
│   │       └── invoice-creator.tsx
│   └── types/auth.ts
└── docker-compose.yml
```

## 既知の論点(将来検討)

- **PDF生成**: 現在はHTML+`window.print()`でブラウザ印刷を経由。本番化時は `puppeteer` または `react-pdf` でサーバーサイド生成への移行を推奨
- **月初バッチ**: `monthly_point_grants` 自動作成は現在ページアクセス時の遅延作成。Vercel Cron 等での毎月1日0時の自動実行を推奨
- **パスワードリセット**: 現在未実装。本番化時に追加が必要
- **テナント追加機能**: 現在シードで1社のみ。複数社運用する場合は管理コンソールが必要

## トラブルシュート

### 「Invalid prisma client constructor」エラー
`npx prisma generate` を実行してください。

### マイグレーションが失敗する
PostgreSQLの接続を確認:
```bash
docker compose ps
docker compose logs postgres
```

### ログイン後すぐにログイン画面に戻る
`AUTH_SECRET` が `.env` に設定されているか確認してください。

### 既存DBにスキーマ変更を反映する(Phase 5→Phase 6)
Phase 6で `SuperAdmin` テーブルが新規追加されました。既存DBがある場合:

```bash
# 推奨: クリーン環境であれば全リセット(全データ消去)
npx prisma migrate reset
# → 「Are you sure?」 → y で実行、シードまで自動実行されます

# データを残したい場合: 増分マイグレーション
npx prisma migrate dev --name phase6_super_admin
npm run db:seed   # スーパー管理者アカウントとC002グローブテックが追加される
```

### Phase 4以前から一気にマイグレーションする場合
Phase 4 → Phase 6 に直接更新する場合は、`Merchant.websiteUrl` カラム(必須)の追加が必要です。

```bash
# 1. 新しいマイグレーションを生成(create-onlyで内容を編集できる)
npx prisma migrate dev --name phase5_6_combined --create-only

# 2. 生成されたSQLを編集して、ALTER TABLE 文に DEFAULT を一時的に付ける
#    例: ALTER TABLE "merchants" ADD COLUMN "website_url" TEXT NOT NULL DEFAULT '';

# 3. マイグレーション適用 + シードで実値を投入
npx prisma migrate dev
npm run db:seed
```

クリーン環境であれば `npx prisma migrate reset` で全リセットが最速です。
