import type { DiscCounts, Winner } from "../game/othello";

type GameResultOverlayProps = {
  discCounts: DiscCounts;
  onNewGame: () => void;
  winner: Winner;
};

export function GameResultOverlay({
  discCounts,
  onNewGame,
  winner,
}: GameResultOverlayProps) {
  const score = `${discCounts.black} - ${discCounts.white}`;

  return (
    <div
      className={["result-overlay", `result-overlay--${winner}`].join(" ")}
      role="dialog"
      aria-labelledby="result-overlay-title"
      aria-modal="true"
    >
      <div className="result-overlay__burst" aria-hidden="true" />
      <div className="result-overlay__content">
        <p className="result-overlay__eyebrow">Game Over</p>
        <h2 id="result-overlay-title" className="result-overlay__title">
          {getResultTitle(winner)}
        </h2>
        <p className="result-overlay__score">{score}</p>
        <div className="result-overlay__discs" aria-hidden="true">
          <span className="result-overlay__disc result-overlay__disc--black" />
          <span className="result-overlay__disc result-overlay__disc--white" />
        </div>
        <button
          className="game-action game-action--primary result-overlay__action"
          onClick={onNewGame}
          type="button"
        >
          New Game
        </button>
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
