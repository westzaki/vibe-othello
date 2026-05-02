# Vibe Othello

AIと対話しながら vibe coding の練習として作っている、ブラウザで遊べるオセロです。
React / TypeScript の設計や、ゲームロジック、CPU対戦、先生モードの実装を少しずつ学ぶことを目的にしています。

## 公開URL

https://westzaki.github.io/vibe-othello/

## このプロジェクトについて

このプロジェクトは、vibe coding とモダンな React / TypeScript の学習用です。
最初は小さな React アプリとして始め、少しずつ以下のような機能を追加しています。

- ブラウザで遊べるオセロ
- 1P / 2P モード
- CPU対戦
- 複数レベルのCPU
- 先生モード / ふりかえり機能
- サウンド
- GitHub Pages での静的公開

## 目的

- vibe coding の練習
- React / TypeScript の学習
- UIとゲームロジックの分離
- CPUアルゴリズムの実装
- AIを使って小さなステップで機能追加する開発スタイルの練習
- 子どもでも楽しく学べるオセロアプリづくり

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

## 技術スタック

- React
- TypeScript
- Vite
- CSS
- GitHub Pages
