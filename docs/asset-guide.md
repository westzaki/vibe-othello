# Asset Guide

このプロジェクトで追加する画像アセットの置き場所と用途をまとめます。

## UI Assets

- `src/assets/ui/app-background.png`
  - 用途: Start / Game / Review / Settings 全体の背景
  - 推奨サイズ: 16:9 横長、現在は 1672x941px
  - 使い方: `src/styles/components/layout.css` の `.app` 背景画像として参照
  - 注意: 中央にUIを重ねるため、中央の装飾やコントラストは控えめに保つ

## Replacement Notes

- `src/assets` 配下の画像は Vite がビルド時にハッシュ付きアセットとして配信します。
- 同じファイル名で差し替える場合、CSSの参照先を変更せずに更新できます。
- `.DS_Store` は不要なOSメタデータなので、`.gitignore` で除外します。
