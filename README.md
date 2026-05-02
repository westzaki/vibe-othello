# Vibe Othello

React / TypeScript の練習として作っている、ブラウザで遊べるオセロです。

## 公開URL

https://westzaki.github.io/vibe-othello/

## このプロジェクトについて

このプロジェクトは、vibe coding の練習用です。

AIと対話しながら少しずつ機能を追加し、React / TypeScript の設計や実装の進め方を学ぶことを目的にしています。

## 目的

- vibe coding の練習
- React / TypeScript の学習
- 小さなステップで機能追加する開発スタイルの練習
- オセロのルールやCPU対戦機能の実装練習

## CPUレベル

このアプリでは、CPUの強さを段階的に変えられます。

| レベル | 表示名 | 挙動 |
| --- | --- | --- |
| Level 1 | Beginner | 合法手からランダムに選びます。 |
| Level 2 | Casual | 角が取れるなら角を選び、それ以外はランダムに選びます。 |
| Level 3 | Normal | 打った直後の盤面を評価して、最も評価が高い手を選びます。 |
| Level 4 | Expert | 盤面の重み、合法手数、角、石数を使って評価します。 |
| Level 5 | Master | 深さ4まで先読みして、最も良さそうな手を選びます。 |
| Level 6 | Grandmaster | 300ms以内でできるだけ深く読み、時間切れ時は完了済みの最善手を使います。 |

## 開発メモ

このアプリは静的サイトとして GitHub Pages に公開しています。
