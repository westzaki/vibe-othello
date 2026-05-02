import type { DiscColor } from "../game/othello";
import type { GameStatus } from "../game/session";

type GameHeaderProps = {
  currentDisc: DiscColor;
  gameStatus: GameStatus;
  isPlaying: boolean;
  onEndGame: () => void;
  onNewGame: () => void;
};

export function GameHeader({
  currentDisc,
  gameStatus,
  isPlaying,
  onEndGame,
  onNewGame,
}: GameHeaderProps) {
  return (
    <div className="game-heading">
      <p className="eyebrow">Game Session</p>
      <h1 id="game-title">Vibe Othello</h1>
      <div className="game-status-row">
        <p className="session-status">{getStatusLabel(gameStatus)}</p>
        <p className="turn-status">
          Current turn:
          <span className={`turn-disc turn-disc--${currentDisc}`}>
            {currentDisc}
          </span>
        </p>
      </div>
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

function getStatusLabel(gameStatus: GameStatus): string {
  if (gameStatus === "playing") {
    return "Playing";
  }

  if (gameStatus === "ended") {
    return "Game ended";
  }

  return "Ready to start";
}
