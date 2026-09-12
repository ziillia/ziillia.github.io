# Drive DJ Finder

現行アプリは **v1.10.0**（`APP_VERSION: 1.10.0-kpop-auto-classification`、BUILD 2026-09-08）です。
Spotifyの縦画面録画から曲名・アーティスト・BPM・Keyを読み取り、MusicBrainz辞書で補完し、DJ用の候補を探します。
アプリは単一HTMLを中心とする構成です。rootのpackage.jsonは開発用テストの入口で、アプリのビルドやnpm依存パッケージは不要です。

## 主要ファイル

| ファイル | 役割 |
| --- | --- |
| `drive-dj-finder.html` | UI、内蔵曲データ、分類、OCR、端末内保存、共有同期 |
| `index.html` | v1.10.0のアプリURLへの転送 |
| `_worker.js` | Cloudflare AccessのJWT検証、D1共有状態API |
| `musicbrainz-ocr-dictionary.js` | OCR補完辞書 |
| `musicbrainz-multi-credit-dictionary.js` | 複数アーティスト名義の補完辞書 |
| `manifest.webmanifest`、`service-worker.js`、`_headers` | PWA、認証遷移を妨げないキャッシュ制御 |
| `kpop-classification.json` | 提供された分類原資料。テスト期待値として参照し、アプリは読み込まない |
| `tests/drive-dj/` | Drive DJ Finder専用Node.js回帰テスト |

`prompt-palette/`と`prompt-palette-v2/`は同居する別アプリです。この開発基盤整備では変更しません。

## 起動

本番は既存のCloudflare Pages配信先の`/drive-dj-finder?v=1.10.0`をSafari等で開き、Cloudflare Accessで認証します。
配信先のドメインと許可ユーザー設定は既存の運用設定を使用してください。このリポジトリだけから本番ドメインは確定できません。

ローカルのUI確認には、Python 3がある環境でリポジトリrootから次を実行します。

```sh
python -m http.server 8000 --bind 127.0.0.1
```

`http://127.0.0.1:8000/drive-dj-finder.html`を開きます。単純な静的サーバーでは拡張子なしURLに対応しないため、`index.html`経由ではなくHTMLを直接開きます。
HTTPでは共有同期を行わずブラウザ内に保存します。静的サーバーは`_worker.js`やD1を実行しません。
OCRエンジン・言語データは外部から取得するため、OCR実行にはネット接続が必要です。

iPhone/iPadでは録画端末を手動選択してください。縦画面が対象で、未選択・横画面・解像度不明は拒否します。
実機確認は既存のHTTPS配信先で行います。Safariの共有メニューからホーム画面へ追加できます。

**既知の案内不整合:** 現行`drive-dj-finder.html`の「iPhone / iPadで開く方法」には`START_IOS_IPADOS.bat`の参照が残っていますが、そのファイルは存在しません。
古いREADMEだけにある参照ではありません。この整備ではHTMLを変更せず、BATも復元しません。本READMEの現行起動手順では使用しません。

## テスト

Node.js 22以上とnpmを使用します。依存パッケージがないため`npm install`は不要です。rootから個別・全体を実行できます。

```sh
npm run test:drive-dj
npm run test:prompt-palette
npm test
```

`npm run test:all`も全テストの別名です。npmがない環境では同じNode.jsコマンドを直接実行できます。

```sh
node --test tests/drive-dj/*.test.cjs
node --test prompt-palette-v2/tests/*.test.cjs
node --test tests/drive-dj/*.test.cjs prompt-palette-v2/tests/*.test.cjs
```

Drive DJ FinderのテストはHTMLから対象の実関数・定数を抽出してNode VM内で実行します。テスト用に分類や同期ロジックを複製しません。
`source.cjs`は現行のトップレベル宣言形式を前提とするため、将来の構造変更時には抽出処理もレビューしてください。
Workerはテスト内だけでexportをVM用に読み替えます。通信・保存・DB・UI更新をモック化し、本番DBやブラウザの保存領域へアクセスしません。

検証対象は版番号一致、分類114名義と関連9名の除外、部分一致防止、collection維持、OCR診断4項目、手動端末選択と切り取り座標、保存キー、共有同期・削除競合・400件分割、D1更新競合とAccess未設定時の拒否です。
動画のOCR精度、実機Safariの描画・操作、実際のAccess認証やD1接続はこのNodeテストの対象外です。

## 現行の共有DB・保存仕様

HTTPS時のみ`./api/shared-state`へ、`credentials: same-origin`と`cache: no-store`で接続します。
Cloudflare Pagesの既存プロジェクトにはD1 binding **`DB`**、環境変数 **`ACCESS_TEAM_DOMAIN`** と **`ACCESS_AUD`** が必要です。
WorkerはAccess JWTのRS256署名・issuer・audience・有効期間を検証します。未設定は503、認証不足は401です。

D1の`shared_state`は`(scope, item_key)`を主キーに、`payload`、`deleted`、`updated_at`、`updated_by`を保持します。
現行Workerが初回API処理時に`CREATE TABLE IF NOT EXISTS`を実行します。この整備ではDBマイグレーションもスキーマ変更も行いません。
共有範囲は`favorites`、`favoriteArtists`、`trackOverrides`、`userTracks`、`customCollections`、`ocrCorrections`の6種類で、許可ユーザー間の共通データです。

同期はGETで比較し、新しいローカル変更だけを400件ずつPOST、送信後に再GETします。サーバーは1リクエスト最大2000操作を受け付け、より新しい時刻の値だけ更新します。
削除はtombstoneとして同期し、ローカルで同時刻の値と削除が競合した場合は削除が優先されます。通信・認証失敗時は端末内の値を保持します。
POSTは異なるOriginを拒否します。APIとページ遷移はService Workerのキャッシュへ逃がさずネットワークに渡し、転送応答・エラーをキャッシュしません。

| 保存対象 | localStorageキー |
| --- | --- |
| 追加曲 | `driveDjUserTracksV2Collections` |
| 旧追加曲の読込元 | `driveDjUserTracksV1` |
| 曲修正 | `driveDjTrackOverridesV1` |
| お気に入り曲 | `driveDjFavoritesV1` |
| お気に入りアーティスト | `driveDjFavoriteArtistsV1` |
| OCR検査方針（端末内） | `driveDjOcrInspectionPolicyV1` |
| 共有削除記録 | `driveDjSharedTombstonesV1` |
| ユーザープレイリスト | `driveDjCustomCollectionsV1` |
| OCR修正学習 | `driveDjOcrCorrectionsV1` |

## 主要安全条件

- K-POPは通常110名義＋企画4名義を正規化したクレジット単位で完全一致させます。部分一致で追加せず、既存collectionを残して`spotify_kpop`を追加します。
- 関連枠のDXTEEN、ICONIQ、INI、JO1、K、ME:I、OCTPATH、OWV、XGは自動分類の対象外です。
- OCR採用確認では`diagArtistGuardBypassed`、`diagMbFailedThenFallback`、`diagGlobalExactNoPaddle`、`diagMergeCanonicalConflict`の4項目をゼロに保ちます。これは診断・採用判断の条件であり、すべての違反をUIが自動停止するという意味ではありません。
- 版名resolver・artist guard・MusicBrainz補完・Paddle判定の既存条件を維持します。
- 画面ROIはiPhoneが`x=.015, y=.18, width=.97, height=.62`、iPadが`x=.015, y=.15, width=.97, height=.74`です。Key位置に対する曲名・アーティストの切り取り座標もテストで固定します。
- 共有同期のキー、6スコープ、時刻比較、削除記録を互換性なく変更しません。画面の「全曲バックアップ」も適宜使用してください。

## デプロイとタグ

本アプリの共有APIはCloudflare Pagesの`_worker.js`とD1を前提とします。GitHub Pagesの静的配信だけでは共有DBは動きません。
既存のCloudflare Pagesプロジェクト・本番ブランチ設定を維持し、rootの静的アセット、`_worker.js`、辞書、`_headers`を含むコミットを配信します。
npmテスト用package.jsonの追加に伴うアプリのビルド工程追加は不要です。

1. 作業ブランチで全テストを実行し、差分をレビューしてPRをmainへマージします。
2. 既存Pagesプロジェクトのデプロイが対象mainコミットを使用していることを確認します。自動連携の有無・出力ディレクトリは既存設定で確認してください。
3. 許可ユーザーで`/drive-dj-finder?v=1.10.0`を開き、版表示、Access認証、共有同期、iPhone/iPadでのOCR・切り取りを確認します。
4. タグはPRマージ後、mainに含まれる正しいリリースコミットを確認して作成します。このPRではタグを作りません。

タグ付け時は`git fetch origin --tags`後に、PRのマージ結果のSHA（squash/rebaseの場合はmain側のSHA）を取得し、`git merge-base --is-ancestor <SHA> origin/main`でmainに含まれることを確認します。
`git show <SHA>:drive-dj-finder.html`等で版番号を確認し、`git tag -l v1.10.0`と`git ls-remote --tags origin refs/tags/v1.10.0`で既存タグがないことも確認します。
確認したSHAに対して`git tag -a v1.10.0 <SHA> -m "Drive DJ Finder v1.10.0"`、`git push origin refs/tags/v1.10.0`を実行します。既存タグの上書きはしません。

## Legacy資料

`README_v1.5.4.txt`、`README_v1.7.5.txt`、`dictionary-check.html`（v1.5.4診断）は履歴資料です。
旧URL、旧バージョン、Service Workerの廃止・解除などの記述はその時点の説明で、現行手順には適用しません。現行の入口は本READMEです。
