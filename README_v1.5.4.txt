Drive DJ Finder v1.5.4 DICTIONARY DIAGNOSTICS
Build: 2026-08-19

目的
- 辞書の配信失敗とiOS Safari上の解析失敗を切り分ける。
- ルートURLとdrive-dj-finder.htmlで別バージョンが開く状態を解消する。

変更点
1. index.htmlを小さなリダイレクトに統一。
2. 15.6MB辞書をscriptタグで直接実行せず、fetch→本文検証→JSON.parseの順に処理。
3. HTTP状態、Content-Type、Content-Length、先頭・末尾、失敗段階、解析時間を診断HTMLへ保存。
4. dictionary-check.htmlを追加。iPhoneだけで辞書単体を診断可能。
5. Service Workerのキャッシュ名を更新し、古いルートHTMLをAPP_SHELLから除外。

GitHubへ反映するファイル
- index.html
- drive-dj-finder.html
- dictionary-check.html
- service-worker.js
- manifest.webmanifest
- musicbrainz-ocr-dictionary.js（既存と同じ297,678件の完全版）
- pwa-icon-180.png / pwa-icon-512.png / _worker.js

確認手順
1. 配信完了後、サイトの /dictionary-check.html をSafariで開く。
2. 「正常に読み込めました / 297,678件」なら配信・JSON解析とも正常。
3. fetch/body失敗なら配信またはキャッシュ、parseで停止・再読込ならSafari実行メモリが原因。
4. アプリを開き、画面下のバージョンが v1.5.4 であることを確認。

注意
- GitHubへZIPそのものを置くだけではサイトは更新されない。ZIPを展開して中のファイルをリポジトリ直下へアップロードする。
- 古いホーム画面アイコンからv1.4.5が開く場合は、一度Safariでdrive-dj-finder.htmlを直接開いて更新する。
