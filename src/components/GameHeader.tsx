import type { DiscColor, DiscCounts, Winner } from "../game/othello";
import type { GameEndReason, GameStatus } from "../game/session";

type GameHeaderProps = {
  currentDisc: DiscColor;
  discCounts: DiscCounts;
  endReason: GameEndReason | null;
  gameStatus: GameStatus;
  isPlaying: boolean;
  message: string | null;
  onEndGame: () => void;
  onNewGame: () => void;
  winner: Winner | null;
};

export function GameHeader({
  currentDisc,
  discCounts,
  endReason,
  gameStatus,
  isPlaying,
  message,
  onEndGame,
  onNewGame,
  winner,
}: GameHeaderProps) {
  return (
    <div className="game-heading">
      <h1 id="game-title">Vibe Othello</h1>
      <div className="score-row" aria-label="Current score">
        <span className="score-chip score-chip--black">
          Black
          <strong>{discCounts.black}</strong>
        </span>
        <span className="score-chip score-chip--white">
          White
          <strong>{discCounts.white}</strong>
        </span>
      </div>
      <div className="game-status-row">
        <p className="session-status">
          {getStatusLabel(gameStatus, endReason)}
        </p>
        {gameStatus === "ended" &&
        endReason === "completed" &&
        winner !== null ? (
          <p className="result-status">{getResultLabel(winner, discCounts)}</p>
        ) : gameStatus === "ended" && endReason === "abandoned" ? (
          <p className="result-status">Game abandoned</p>
        ) : (
          <p className="turn-status">
            Current turn:
            <span className={`turn-disc turn-disc--${currentDisc}`}>
              {currentDisc}
            </span>
          </p>
        )}
      </div>
      {message !== null && (
        <p className="game-message" role="status">
          {message}
        </p>
      )}
      <div className="game-actions" aria-label="Game controls">
        {isPlaying ? (
          <button className="game-action" onClick={onEndGame} type="button">
            End Game
          </button>
        ) : (
          <button
            className="game-action game-action--primary"
            onClick={onNewGame}
            type="button"
          >
            Start Game
          </button>
        )}
      </div>
    </div>
  );
}

function getResultLabel(winner: Winner, discCounts: DiscCounts): string {
  const score = `${discCounts.black} - ${discCounts.white}`;

  if (winner === "draw") {
    return `Draw ${score}`;
  }

  return `${winner} wins ${score}`;
}

function getStatusLabel(
  gameStatus: GameStatus,
  endReason: GameEndReason | null,
): string {
  if (gameStatus === "playing") {
    return "Playing";
  }

  if (gameStatus === "ended") {
    return endReason === "completed" ? "Game complete" : "Game stopped";
  }

  return "Ready to start";
}
