Drive DJ Finder v1.5.0 PADDLE A/B
Build: 2026-08-18

変更点
- Tesseract＋辞書で確定しない行、または補正根拠が弱い行だけPP-OCRv5 mobileで再認識します。
- 同じBPM・KEY・画像ハッシュの行はPaddleOCR結果を再利用し、重複フレームの推論を省きます。
- PaddleOCRの初期化・推論が失敗しても処理を止めず、Tesseract結果へ自動で戻ります。
- 診断HTMLへTESS/PADDLE/採用エンジン、Paddle実行数・再利用数・採用数・失敗数・処理時間を保存します。
- Web画面の上部・フッター・manifestへv1.5.0を表示します。

採用ルール
1. 手動教師データ、完全一致タイトル、強い辞書一致はPaddleOCRへ送らず確定します。
2. 未確定または弱い補正だけPaddleOCRへ送ります。
3. PaddleOCRが辞書で一意に確定した場合、または認識信頼度と既知アーティスト一致が十分な場合だけ採用します。
4. 判断材料が弱ければTesseractへ戻し、要確認のまま上段へまとめます。

診断の見方
- PADDLE準備 = 1: モデル準備成功
- PADDLE実行: 実際に推論したユニーク行数
- PADDLE再利用: 重複行で推論を省いた回数
- PADDLE採用: PaddleOCRへ切り替えた行数
- PADDLE戻し: 比較後にTesseractを維持した回数
- PADDLE失敗: SDK・モデル・行推論の失敗数（失敗時もTesseractで継続）
- MB辞書 = 0: musicbrainz-ocr-dictionary.js未読込。Git上の15MB版とPWA更新を確認してください。

外部取得
- @paddleocr/paddleocr-js 0.4.2
- PP-OCRv5_mobile_det / PP-OCRv5_mobile_rec
- onnxruntime-web 1.22.0 WASM
- Tesseract.js 5.1.1（BPM検出・比較・フォールバック）

注意
- 初回だけPaddleOCRのSDKとモデル取得に時間がかかります。
- iPhoneの処理が重い場合は「高精度OCR（Paddle）」をOFFにすればv1.4.5相当の経路で動きます。
- 配布ZIPは既存の15MB辞書を保護するためmusicbrainz-ocr-dictionary.jsを含みません。
