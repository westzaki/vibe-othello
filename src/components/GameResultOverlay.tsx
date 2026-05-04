import type { DiscCounts, Winner } from "../game/othello";
import type { PlayerSettings } from "../game/players";
import { getResultTitle, getResultTone } from "./resultLabels";

type GameResultOverlayProps = {
  discCounts: DiscCounts;
  onBackToStart: () => void;
  onOpenReview?: () => void;
  onPlayAgain: () => void;
  players: PlayerSettings;
  winner: Winner;
};

export function GameResultOverlay({
  discCounts,
  onBackToStart,
  onOpenReview,
  onPlayAgain,
  players,
  winner,
}: GameResultOverlayProps) {
  const score = `${discCounts.black} - ${discCounts.white}`;
  const resultTone = getResultTone(winner, players);

  return (
    <div
      className={[
        "result-overlay",
        `result-overlay--${winner}`,
        `result-overlay--${resultTone}`,
      ].join(" ")}
      aria-labelledby="result-title"
    >
      <div className="result-overlay__burst" aria-hidden="true" />
      <div className="result-overlay__content">
        <p className="result-overlay__eyebrow">対局終了</p>
        <h2 id="result-title" className="result-overlay__title">
          {getResultTitle(winner, players)}
        </h2>
        <p className="result-overlay__score">{score}</p>
        <div className="result-overlay__discs" aria-hidden="true">
          <span className="result-overlay__disc result-overlay__disc--black" />
          <span className="result-overlay__disc result-overlay__disc--white" />
        </div>
        <div className="result-overlay__actions">
          {onOpenReview !== undefined && (
            <button
              className="game-action game-action--primary"
              onClick={onOpenReview}
              type="button"
            >
              ふりかえり
            </button>
          )}
          <button
            className={[
              "game-action",
              onOpenReview === undefined ? "game-action--primary" : "",
            ].join(" ")}
            onClick={onPlayAgain}
            type="button"
          >
            もう一回
          </button>
          <button className="game-action" onClick={onBackToStart} type="button">
            タイトルへ
          </button>
        </div>
      </div>
    </div>
  );
}
