## 助けっ人掲示板（公開ベータ最小構成）

答えを急ぐ Q&A ではなく、モヤモヤに角度を重ねて深堀りするための掲示板です。

**Vercel / PostgreSQL（env・Preview・本番）**: 下記「Vercel 前提の構成」以降の節に、Dashboard / CLI 手順、環境変数の振り分け、Prisma の `migrate deploy` 方針、公開前チェックリストをまとめています。

## ローカル起動手順

1. 依存関係をインストール

```bash
npm ci
```

2. `.env.example` をコピーして `.env` を作成

```bash
# Windows (PowerShell)
copy .env.example .env
# macOS / Linux
cp .env.example .env
```

3. DB 準備とシード投入（PostgreSQL）

```bash
npx prisma migrate deploy
npm run seed
```

4. 起動

```bash
npm run dev
```

開発環境: [http://localhost:3000](http://localhost:3000)

## Realtime（Pusher Channels / 最小）

深堀りの重なりをその場で反映するために、Pusher Channels を使った最小 realtime を入れています。

`.env` に次を追加してください（`.env.example` にも記載済み）。

```bash
PUSHER_APP_ID=app_id
PUSHER_KEY=key
PUSHER_SECRET=secret
PUSHER_CLUSTER=ap3
NEXT_PUBLIC_PUSHER_KEY=key
NEXT_PUBLIC_PUSHER_CLUSTER=ap3
```

### ローカル確認（最小）

1. `npm run dev` を起動  
2. 同じ投稿詳細 `/posts/[id]` を2タブで開く  
3. 片方で深堀りを重ねると、もう片方にも新しい角度が反映される（ページ全体再読込ではなく route refresh）
4. ログイン中に `/me` を開き、別タブで深堀りを重ねると、**返ってきた重なり / 手元で新しく動いた流れ / ヘッダー件数** が自然に更新される

## 最小モデレーション（通報 / 非表示 / 管理確認）

- 投稿詳細 `/posts/[id]` で、ログイン中ユーザーは
  - 流れ: **この流れを知らせる**
  - 各深堀り: **この角度を知らせる**
  から、理由（選択式）と任意メモを送れます。
- 通報は最小ループとして `OPEN` で受け、管理画面で確認します。
- 管理画面: `/admin/reports`（管理者のみ）
  - `REVIEWED` / `DISMISSED` への更新
  - 対象の流れ・角度を「見えないようにする」（soft-hide）

### admin 判定（最小）

`.env` の `ADMIN_EMAILS`（カンマ区切り）と、Auth.js セッションの `user.email` を照合します。

```bash
ADMIN_EMAILS=foo@example.com,bar@example.com
```

対象が hidden のときは削除せず、画面上で自然文言に置き換えて表示します（hard delete なし）。

## DB / Prisma（PostgreSQL 一本）

- スキーマは `prisma/schema.prisma` の **PostgreSQL** のみです（`DATABASE_URL`）。
- 履歴管理は **Prisma Migrate** です。初期マイグレーションは `prisma/migrations/20260401120000_init/` にあります。
- **空の DB**（新規 Neon / Vercel Postgres など）: デプロイ前に `npx prisma migrate deploy`（またはホストの CI）でスキーマを作成します。
- **すでに `db push` で作ったローカル DB** がある場合、初回だけ履歴を噛み合わせます（SQL は流さず履歴だけ記録）:

```bash
npx prisma migrate resolve --applied 20260401120000_init
```

- スキーマを変えた開発者向け: `npm run db:migrate`（`prisma migrate dev`）で新しい migration を生成し、コミットしてください。

本番・Preview の詳細な運用順序は下記「Vercel と PostgreSQL」「Prisma の本番運用方針」を参照してください。

`/posts/[id]` では、ログイン中のユーザーが流れを **手元に置く / 手元から外す** できます。手元に置いた流れは `/me` の **手元に置いた流れ** セクションで確認でき、前回見たあとに動いた流れは **手元で新しく動いた流れ** にまとまります。そこから **新しく動いた角度を見る**（`#deepdive-…` に着地）や **この新しい角度にさらに重ねる**（投稿フォームがその深堀り向けに開く）へすぐ進めます。見に行くだけ・重ねに行くだけでは区切りは変わらず、詳細の **ここまで見たことにする** でだけ基準を更新できます。

投稿詳細 `/posts/[id]` には、**この流れを共有する** の最小導線があります。対応ブラウザでは Web Share API を使い、非対応環境では URL コピー（`URLを控える`）へ自然に寄せます。共有時の preview は投稿ごとの metadata（title / description / openGraph）を使うため、投稿単位で不自然になりにくい見え方になります。

## 認証（サインアップ / サインイン）

Auth.js（Credentials）＋Prisma 構成です。公開ベータ向けの最小導線として、`/signup` から一般ユーザー登録できます。

- サインアップ: [http://localhost:3000/signup](http://localhost:3000/signup)
- サインイン: [http://localhost:3000/signin](http://localhost:3000/signin)

共有リンクから未ログインで `/posts/[id]` に来た場合でも、投稿詳細の案内からそのまま **はじめる / 入る** へ進めます。`callbackUrl` を使っているため、登録・ログイン後は元の `/posts/[id]` に自然に戻れます。
この復帰直後（shared landing 経由）だけは、`/posts/[id]` の深堀りフォーム近くに「最初の角度を置く」ための軽い案内と CTA が出ます。最初の1件を投稿すると復帰専用の query は外れ、通常の投稿詳細表示に戻ります。

### 新規登録確認手順

1. `/signup` で「表示名 / メール / パスワード（8文字以上）」を入力
2. 登録後、ログイン状態で `/` に遷移することを確認
3. ヘッダーに表示名・`/me` 導線が出ることを確認

デモアカウントも引き続き利用できます（ローカル検証向け）。

`npm run seed` 後に使えるデモアカウント（メール / パスワードは全員共通で **demo123**）:

| メール | 表示名 |
| --- | --- |
| ayano@demo.local | 彩乃 |
| kenta@demo.local | 健太 |
| misaki@demo.local | 美咲 |
| takumi@demo.local | 拓海 |
| hina@demo.local | 陽菜 |
| ren@demo.local | 蓮 |
| emptyincoming@demo.local | 空澄（返ってきた重なりなし / 手元の新しい動きなしの例） |

## Stripe 最小課金（サポーター会員）

公開ベータ向けに、Stripe Checkout + Customer Portal + Webhook の最小構成を入れています。

- 価格ページ: `/pricing`
- 会員と支払い: `/billing`（ログイン必須）
- Webhook 受け口: `/api/stripe/webhook`

### Stripe 側で用意するもの

1. 月額の Price を1つ作る（サポーター会員）
2. API キーを発行する（`STRIPE_SECRET_KEY` / 必要なら `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`）
3. Webhook endpoint を `/api/stripe/webhook` で作り、署名シークレットを発行する（`STRIPE_WEBHOOK_SECRET`）

`.env` に最低限これを設定します。

```bash
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_ID_SUPPORTER=price_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

### ローカル確認（最小）

1. `npm run dev` を起動
2. 別ターミナルで Stripe CLI を使い webhook を転送  
   `stripe listen --forward-to http://127.0.0.1:3000/api/stripe/webhook`
3. 表示された `whsec_...` を `STRIPE_WEBHOOK_SECRET` に設定
4. `/pricing` で加入導線、`/billing` で会員状態表示を確認

Webhook 実通信 E2E は現段階では必須にしていません。公開ベータでは手動確認を最小セットにしています。

## 広告基盤（最小）

公開後に AdSense 接続と審査へ進めるため、環境変数で有効化できる最小広告基盤を入れています。

`.env` の最小設定:

```bash
NEXT_PUBLIC_ENABLE_ADS=false
NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-xxxxxxxxxxxxxxxx
```

- `NEXT_PUBLIC_ENABLE_ADS=true` かつ `NEXT_PUBLIC_ADSENSE_CLIENT` 設定時のみ広告枠を有効化します。
- ad unit id（`NEXT_PUBLIC_ADSENSE_SLOT_HOME_INLINE` / `NEXT_PUBLIC_ADSENSE_SLOT_POST_FOOTER`）が未設定でも画面は壊れず、枠だけを表示できます。
- まずは「深堀りの流れを邪魔しない」配置を優先し、公開後に AdSense 側の接続・審査へ進める想定です。

## 公開ベータ確認ページ

- `/` トップ（公開向けの短い導入文つき）
- `/about` 助けっ人掲示板とは
- `/guidelines` 使い方と流れ
- `/privacy` プライバシー（最小）
- `/terms` 利用規約（最小）
- `/ads-info` 広告と運営方針
- `/signup` はじめる
- `/signin` 入る
- `/pricing` 料金
- `/billing` 会員と支払い（ログイン必須）

ログイン中は、`/` のメイン一覧・「今動いている流れ」などの discovery 面や、投稿詳細の **近い流れ** で、いま開いているカードが **すでに手元に置いてある流れか**、**前回見たあとに手元で新しく動いているか** を、タイトル付近の一言だけで薄く示します（未ログインや未保存のカードでは表示しません）。保存や既読の操作が増えるわけではなく、`/posts/[id]` の導線はこれまでどおりです。

### `/me`（ログイン中のみ）

冒頭の **いま返しやすい流れ** に、「自分へ返ってきた重なり」と「手元で新しく動いた流れ」を束ねた短い一覧が載ります。各項目から **この角度を見る**（`#deepdive-[id]`）と **さらに重ねる**（深堀り向けにフォームが開く）へすぐ進めます。ここから **さらに重ねる** で投稿したときは、投稿後に `/me` の作業面（いま返しやすい流れ付近）へ戻れます。

**自分へ返ってきた重なり**（ほかの人が自分の流れや自分の角度の上に重ねた深堀り）、**手元で新しく動いた流れ**、**手元に置いた流れ**、**自分が立てた流れ**、**自分が重ねた角度**もこれまでどおり並び、各項目から `/posts/[id]`（深堀りは `#deepdive-[id]`）へ戻れます。**元の位置を見る**だけでなく、**この角度にさらに重ねる**から同じ深堀りを親にした投稿フォームを開いた状態に直行できます。**前回「ここまで見た」としたあとに新しく返ってきた重なり**は、ページ上部の一文・各カードの薄い強調・ヘッダーの小さな件数で分かります。開いただけでは消えず、**ここまで見たことにする**で区切りをつけられます。手元に置いた流れも同様に、`/posts/[id]` の **ここまで見たことにする** で見た基準を更新できます。

1. `npm run dev` で起動し、[http://localhost:3000/signin](http://localhost:3000/signin) からデモアカウントで入る（例: 彩乃 / `ayano@demo.local` + `demo123`）。
2. ヘッダーの **自分の流れ** か [http://localhost:3000/me](http://localhost:3000/me) を開く。
3. 彩乃の例: 返ってきた重なり・自分が著者の流れ・自分が書いた深堀りがそれぞれのブロックに並びます。空澄（`emptyincoming@demo.local`）の例では、まだほかの人からの重なりがないときの表示を確認できます。未ログインで `/me` に入ると、サインインへ誘導され、後に `/me` へ戻れます。

スキーマ変更後にローカル DB を作り直す場合は、PostgreSQL 側で DB を空にするか別 DB を指してから `npx prisma migrate deploy` と `npm run seed` をやり直すとよいです。

## E2E testing

Run setup once (or when DB is reset), then run Playwright:

```bash
npx prisma migrate deploy
npm run seed
npx playwright install chromium
npm run e2e
```

別のターミナルで `npm run dev` を動かしている場合は止めるか、`playwright.config.ts` の `reuseExistingServer` を `PW_REUSE_DEV_SERVER=1` で明示的に有効化し、**同じ `DATABASE_URL` でシードした DB** を参照してください（デフォルトでは Playwright が起動する dev 用にポートを占有します）。

## Home flow surfaces (entry points)

On `/` when you are **not** filtering by `q`, `postType`, or `tag`, two light sections appear **above the main list**:

- **今動いている流れ** — flows scored like “hot” (deep-dive count + recent overlap activity).
- **まだ深堀りが少ない流れ** — flows with few deep dives (0–2) and a recent create/update, excluding the picks above.

When **signed in** under the same conditions, **今の自分に近い流れ** also appears above those blocks. It uses your recent tags / types / touches (simple overlap scoring). If there is not enough signal yet (e.g. no tagged posts and no deep dives you placed), you see a short empty state instead of a list.

Links open `/posts/[id]` without `from*` params; **一覧へ戻る** on the detail page returns to `/`. With search/type/tag filters, these sections hide so the main filtered list stays the focus.

Local check: after `npm run seed`, open `/` — both sections (or their natural empty copy) should appear; open a card and confirm the detail page and back link.

## Top page discovery filters

The top page (`/`) supports combining these query params:

- `q`: title/body/tag partial match
- `postType`: `WORRY | ISSUE | DEDUCTION | HYPOTHESIS | PREDICTION`
- `tag`: tag exact match
- `sort`: `new | deep | hot`

Example:

```bash
http://localhost:3000/?q=将来&postType=HYPOTHESIS&tag=将来&sort=hot
```

When you open a post from this filtered list, the discovery context is carried to `/posts/[id]` as `fromQ/fromPostType/fromTag/fromSort`, so you can return to the same filtered flow from the detail page.

Post detail pages include a **近い流れ** block (tag/type overlap and light ranking) so readers can move to nearby threads without losing the same `from*` context when they open a suggested post; **一覧へ戻る** still returns to the list you came from.

Local check: open any `/posts/[id]` after `npm run seed` — you should see the section (or a gentle empty state) and links that keep `fromQ` / `fromPostType` / `fromTag` / `fromSort` on navigation.

## Vercel 前提の構成（確認済みの要点）

- **Next.js 16**: `vercel.json` で `buildCommand` が `npm run build:production`（`prisma generate` のあと `next build`）。
- **Prisma**: PostgreSQL。ビルド時に Client 生成済み。スキーマ変更後は **ホスト側で** `migrate deploy` を先に実行する（下記）。
- **metadata / SEO**: `src/lib/site.ts` の `getSiteUrl()` が `NEXT_PUBLIC_SITE_URL` → `AUTH_URL` → `VERCEL_*` の順で解決するため、未設定でも Vercel 上では Preview URL を基準に `robots.txt` / `sitemap.xml` が組み立てられる。本番では明示設定を推奨。
- **固定ページ**: `/privacy`・`/terms` は静的ルートとして存在（ビルド出力に含まれる）。

## 環境変数の整理（Development / Preview / Production）

Vercel Dashboard の **Settings → Environment Variables** で、各キーを *Development* / *Preview* / *Production* に割り当てます。CLI 利用時は `vercel env add` で同様にスコープを選べます。

| 変数 | 用途 | Development（ローカル） | Preview | Production |
| --- | --- | --- | --- | --- |
| `DATABASE_URL` | Prisma | ローカル Postgres 推奨 | **Preview 専用**の Postgres（本番と分離） | **本番** Postgres のみ |
| `AUTH_SECRET` | Auth.js | `.env` | 設定必須（本番と別でも可） | 設定必須（長いランダム文字列） |
| `AUTH_URL` | Auth.js の URL 解決 | `http://127.0.0.1:3000` | その Preview の `https://….vercel.app` を推奨（`trustHost` でも動くことが多いが、Cookie まわりで詰まったら設定） | 本番 `https://…` |
| `NEXT_PUBLIC_SITE_URL` | canonical / OGP / sitemap 基準 | ローカル URL | その Preview の `https://…` を推奨（未設定なら `VERCEL_URL` フォールバック） | 本番 `https://…` |
| `ADMIN_EMAILS` | 管理画面 | 開発用メール | チーム用 | 運用者メール |
| `STRIPE_SECRET_KEY` | Stripe API | test | **test** 推奨 | **live** |
| `STRIPE_WEBHOOK_SECRET` | Webhook 署名 | CLI `stripe listen` の `whsec` | Preview 用エンドポイントを別途作るか test のまま | 本番 Webhook の `whsec` |
| `STRIPE_PRICE_ID_SUPPORTER` | Checkout | test Price | test Price | live Price |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | 将来のクライアント用 | 任意 | 任意 | 任意 |
| `PUSHER_*` / `NEXT_PUBLIC_PUSHER_*` | リアルタイム | 開発用 app | **別 app 推奨**（本番と分離） | 本番 app |
| `NEXT_PUBLIC_ENABLE_ADS` / `NEXT_PUBLIC_ADSENSE_*` | 広告 | 通常 `false` | 通常 `false` | 審査・公開に合わせて |

コード参照: `src/lib/site.ts`（サイト URL）、`src/auth.ts`（`trustHost: true`）、`src/lib/stripe.ts`・`src/app/api/stripe/webhook/route.ts`、`src/lib/realtime-*.ts`、`src/lib/ads.ts`、`src/lib/admin.ts`。

## Preview デプロイの最短手順（Dashboard 中心）

1. [Vercel](https://vercel.com) で **New Project** → GitHub リポジトリを Import（Root はリポジトリ直下のまま）。
2. **Environment Variables** に、上表のとおり **Preview** 用の `DATABASE_URL` と認証・Stripe（test）・Pusher などを登録。`DATABASE_URL` は本番と共有しない。
3. 対象ブランチへ **push** するか **Pull Request** を開く → Vercel が **Preview Deployment** を生成。
4. 発行された **Preview URL** を開き、下の **Preview で確認する画面・導線** に沿って確認。初回だけ、Preview の DB に対してローカルから `DATABASE_URL` を一時的に差し替えて `npx prisma migrate deploy` を実行し、必要なら `npm run seed`（デモデータ）を流す。

### Preview で確認する画面・導線

- `/`（未フィルタで「今動いている流れ」等が自然か。フィルタ時はメイン一覧中心か）
- `/?q=…&postType=…&tag=…&sort=…` → 一覧から `/posts/[id]` → **一覧へ戻る**（discovery の roundtrip）
- `/posts/[id]` の **compose**（親深堀りに重ねる、`composeParentDeepDiveId` 等が期待どおり外れるか）。迷う場合はローカルで `e2e/posts.detail.compose.spec.ts` を参照
- `/privacy` / `/terms`
- ログインできる設定なら `/me` の「さらに重ねる」→ compose（`e2e/me.spec.ts` 相当）

**ビルド**: リポジトリの `vercel.json` により `npm run build:production` が使われます。マイグレーションは Vercel の build 内では自動実行していません（意図的に DB 操作をデプロイと分離）。

## Vercel CLI（任意・最短）

Dashboard と同じ設定が最終的な正です。CLI はローカルに環境を引き下ろして試すときに便利です。

```bash
npm i -g vercel
cd /path/to/repo
vercel link
vercel env pull .env.local
vercel          # Preview 相当のローカル試行
vercel --prod   # Production デプロイ（権限と確認プロンプトに注意）
```

- `vercel link`: プロジェクトと紐づけ。
- `vercel env pull`: リモートの env を `.env.local` に取得（`.gitignore` 対象のままにする）。
- 本番・Preview の **DB マイグレーション** は、セキュリティと再現性のため **デプロイ前後にホストから** `npx prisma migrate deploy` を実行する運用を推奨。

## Prisma の本番運用方針

- **推奨**: **`prisma migrate deploy`**（`npm run db:deploy`）。マイグレーションは `prisma/migrations/` を Git で管理し、本番・Preview の各 DB に適用する。
- **初回**: リポジトリに `20260401120000_init` を追加済み。空の PostgreSQL では `migrate deploy` だけでスキーマが揃う。
- **既存の `db push` 済み DB** は、一度だけ `npx prisma migrate resolve --applied 20260401120000_init` で履歴を baseline する（中身が diff と一致していることが前提）。
- **`db push` を続ける場合**: 履歴が残らず、本番と検証環境のズレやロールバックが難しい。**非推奨**だが、極小公開では「単一本番 DB にだけ手元から `db push`」と割り切ることは可能。その場合は変更内容と実行タイミングを人手で管理する必要がある。

## production seed 方針

- `npm run seed` / `npm run seed:demo` は **local / Preview / CI 向け**（デモデータ）。**Production では実行しない**。
- `npm run seed:prod` は **production 向け**（現状 no-op。必要時のみ最小初期化を足す想定）。

## launch 前チェック（本番 `.env` を用意したうえで）

```bash
npm run launch:check
```

- 必須 env の欠落で失敗する（`NEXT_PUBLIC_SITE_URL` を含む）。
- `AUTH_URL` / `NEXT_PUBLIC_SITE_URL` が `http://` や localhost のときは警告する。
- Stripe / Pusher / AdSense の任意項目は未設定でも警告のみ。

## Production 公開前の最終チェックリスト（この順で）

1. **Vercel `Production` の env** が揃っている（上表。`DATABASE_URL` が本番 DB を指していることを再確認）。
2. **Preview 用 env が本番 DB を指していない**こと（誤共有がないか）。
3. 本番 DB に **`npx prisma migrate deploy`** を実行済み（新しい migration をマージしたあと必ず）。
4. **`npm run launch:check`** を本番相当の `.env` で通過。
5. **`vercel --prod` または main への merge** で Production デプロイ。
6. ブラウザ確認: `/` → フィルタ付き一覧（`?q=` / `postType` / `tag` / `sort`）→ `/posts/[id]` → **一覧へ戻る** で文脈復帰。
7. `/posts/[id]` で **compose 導線**（親深堀りに重ねる・`/me` からの「さらに重ねる」）が期待どおりか。迷ったらローカルで `npm run e2e`（`posts.detail.compose.spec.ts` / `me.spec.ts` / `posts.discovery-context-roundtrip.spec.ts` など）の結果を参照。
8. `/privacy` / `/terms` / `robots.txt` / `sitemap.xml`。
9. ログイン・課金・realtime・通報のうち、運用で使うものだけスポット確認。
10. **GitHub Actions** の最新 run が緑か（失敗している場合は原因を把握してから本番反映）。

## migration / deploy 実行順（ローカル開発）

```bash
# 初回クローン後（PostgreSQL を用意したうえで）
npx prisma migrate deploy
npm run seed

# スキーマを変えたあと（開発者）
npm run db:migrate
# コミット: prisma/migrations/ の新規ファイル

# 本番・Preview の DB へ（デプロイ前後・ホストから）
npm run db:deploy
```

Vercel 上のビルドは `npm run build:production` のみ。スキーマ変更をデプロイしたら、**必ず**対象環境の DB に `migrate deploy` を当ててから（または直後に）動作確認してください。

## 公開直後にまず見る順番（最初の30分）

1. `/`
2. `/signup` と `/signin`
3. `/posts/[id]`（投稿詳細 / 深堀り）
4. `/me`
5. `/pricing` と `/billing`
6. `/admin/reports`（admin のみ）

## 公開後チェックリスト

- `/` が開く
- `/about` / `/guidelines` / `/privacy` / `/terms` が開く
- `/signup` / `/signin` で登録・ログインできる
- 投稿作成（`/posts/new`）ができる
- 投稿詳細（`/posts/[id]`）で deepdive 投稿できる
- `/me` が表示される
- 保存（手元に置く / 外す）が動く
- `/pricing` / `/billing` が期待どおりに動く
- realtime（2タブで deepdive 反映）が動く
- report 導線と `/admin/reports`（admin）が動く
- 共有導線（Web Share または URL コピー）が動く
- 広告枠（`NEXT_PUBLIC_ENABLE_ADS=true` 時）が表示される
- 404 ページ（存在しない URL）が表示される
- error UI（意図的な例外経路で）を確認できる
- metadata（title / description / OGP）が主要ページで自然
- `/robots.txt` が返る
- `/sitemap.xml` が返る

## 今回やらないこと（運用メモ）

- 本番 deploy の自動化高度化
- migrate 全面移行
- Docker 化
- 監視基盤の本格導入
- Sentry 等の本格エラートラッキング
- アナリティクス本格導入
- 独自ドメイン設定の自動化
- CDN / 画像最適化の深掘り

## CI

GitHub Actions（`.github/workflows/ci.yml`）は **サービスコンテナの PostgreSQL 16** で実行します。本番・Preview の DB とは別です。

実行内容:

- `npm ci`
- `npx prisma migrate deploy`
- `npm run seed`
- `npx playwright install --with-deps chromium`
- `npm run lint`
- `npm run build`
- `npm run e2e`

Minimal local reproduction:

```bash
npm ci
npx prisma migrate deploy
npm run seed
npx playwright install chromium
npm run lint
npm run build
npm run e2e
```

ワークフローでは `AUTH_SECRET` と `AUTH_URL` を渡しているので、認証が絡む E2E が CI 上で成立します。`e2e/auth-session.spec.ts` がデモログインと投稿／深堀り導線を最小限テストします。`e2e/me.spec.ts` が `/me` の未ログイン導線・ヘッダー・「自分へ返ってきた重なり」を含む各セクション・深堀りアンカー遷移・空状態をテストします。
