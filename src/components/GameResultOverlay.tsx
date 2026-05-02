import type { DiscCounts, Winner } from "../game/othello";

type GameResultOverlayProps = {
  discCounts: DiscCounts;
  onBackToStart: () => void;
  onPlayAgain: () => void;
  winner: Winner;
};

export function GameResultOverlay({
  discCounts,
  onBackToStart,
  onPlayAgain,
  winner,
}: GameResultOverlayProps) {
  const score = `${discCounts.black} - ${discCounts.white}`;

  return (
    <div
      className={["result-overlay", `result-overlay--${winner}`].join(" ")}
      aria-labelledby="result-title"
    >
      <div className="result-overlay__burst" aria-hidden="true" />
      <div className="result-overlay__content">
        <p className="result-overlay__eyebrow">Game Over</p>
        <h2 id="result-title" className="result-overlay__title">
          {getResultTitle(winner)}
        </h2>
        <p className="result-overlay__score">{score}</p>
        <div className="result-overlay__discs" aria-hidden="true">
          <span className="result-overlay__disc result-overlay__disc--black" />
          <span className="result-overlay__disc result-overlay__disc--white" />
        </div>
        <div className="result-overlay__actions">
          <button
            className="game-action game-action--primary"
            onClick={onPlayAgain}
            type="button"
          >
            Play Again
          </button>
          <button className="game-action" onClick={onBackToStart} type="button">
            Title Screen
          </button>
        </div>
      </div>
    </div>
  );
}

function getResultTitle(winner: Winner): string {
  if (winner === "draw") {
    return "Draw";
  }

  return `${winner} wins`;
}
