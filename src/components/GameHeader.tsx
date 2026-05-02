import type { DiscColor, DiscCounts, Winner } from "../game/othello";
import type { GameStatus } from "../game/session";

type GameHeaderProps = {
  currentDisc: DiscColor;
  discCounts: DiscCounts;
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
  gameStatus,
  isPlaying,
  message,
  onEndGame,
  onNewGame,
  winner,
}: GameHeaderProps) {
  return (
    <div className="game-heading">
      <p className="eyebrow">Game Session</p>
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
        <p className="session-status">{getStatusLabel(gameStatus)}</p>
        {gameStatus === "ended" && winner !== null ? (
          <p className="result-status">{getResultLabel(winner, discCounts)}</p>
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
        <button
          className="game-action game-action--primary"
          onClick={onNewGame}
          type="button"
        >
          New Game
        </button>
        <button
          className="game-action"
          disabled={!isPlaying}
          onClick={onEndGame}
          type="button"
        >
          End Game
        </button>
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

function getStatusLabel(gameStatus: GameStatus): string {
  if (gameStatus === "playing") {
    return "Playing";
  }

  if (gameStatus === "ended") {
    return "Game ended";
  }

  return "Ready to start";
}
