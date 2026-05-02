import type { Disc } from "./game/othello";
import type { GameStatus } from "./game/session";
import { useOthelloGame } from "./hooks/useOthelloGame";

export default function App() {
  const game = useOthelloGame();

  return (
    <main className="app">
      <section className="game-shell" aria-labelledby="game-title">
        <div className="game-heading">
          <p className="eyebrow">Game Session</p>
          <h1 id="game-title">Vibe Othello</h1>
          <div className="game-status-row">
            <p className="session-status">{getStatusLabel(game.gameStatus)}</p>
            <p className="turn-status">
              Current turn:
              <span className={`turn-disc turn-disc--${game.currentDisc}`}>
                {game.currentDisc}
              </span>
            </p>
          </div>
          <div className="game-actions" aria-label="Game controls">
            <button
              className="game-action game-action--primary"
              onClick={game.startNewGame}
              type="button"
            >
              New Game
            </button>
            <button
              className="game-action"
              disabled={!game.isPlaying}
              onClick={game.endGame}
              type="button"
            >
              End Game
            </button>
          </div>
        </div>

        <div className="board-frame" aria-label="Playable Othello board">
          <div className="board-grid">
            {game.board.map((cell, square) => {
              const isLegal = game.legalMoves.includes(square);

              return (
                <button
                  aria-label={
                    cell === null
                      ? getEmptySquareLabel(square, game.currentDisc, isLegal)
                      : `Square ${square + 1} has a ${cell} disc`
                  }
                  className={[
                    "board-square",
                    isLegal ? "board-square--legal" : "",
                  ].join(" ")}
                  disabled={!isLegal}
                  key={square}
                  onClick={() => game.placeCurrentDisc(square)}
                  type="button"
                >
                  {cell !== null && (
                    <span
                      aria-hidden="true"
                      className={`disc disc--${cell}`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </main>
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

function getEmptySquareLabel(
  square: number,
  currentDisc: Disc,
  isLegal: boolean,
): string {
  if (isLegal) {
    return `Place ${currentDisc} disc on square ${square + 1}`;
  }

  return `Square ${square + 1} is not a legal move`;
}
