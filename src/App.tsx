import { useState } from "react";
import {
  createInitialBoard,
  getLegalMoves,
  getNextDisc,
  placeDisc,
  type Disc,
} from "./game/othello";

type GameStatus = "notStarted" | "playing" | "ended";

export default function App() {
  const [board, setBoard] = useState(createInitialBoard);
  const [currentDisc, setCurrentDisc] = useState<Disc>("black");
  const [gameStatus, setGameStatus] = useState<GameStatus>("notStarted");

  const isPlaying = gameStatus === "playing";
  const legalMoves = isPlaying ? getLegalMoves(board, currentDisc) : [];

  function handleNewGame() {
    setBoard(createInitialBoard());
    setCurrentDisc("black");
    setGameStatus("playing");
  }

  function handleEndGame() {
    setGameStatus("ended");
  }

  function handleSquareClick(square: number) {
    if (!isPlaying) {
      return;
    }

    const nextBoard = placeDisc(board, square, currentDisc);

    if (nextBoard === board) {
      return;
    }

    setBoard(nextBoard);
    setCurrentDisc(getNextDisc(currentDisc));
  }

  return (
    <main className="app">
      <section className="game-shell" aria-labelledby="game-title">
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
              onClick={handleNewGame}
              type="button"
            >
              New Game
            </button>
            <button
              className="game-action"
              disabled={!isPlaying}
              onClick={handleEndGame}
              type="button"
            >
              End Game
            </button>
          </div>
        </div>

        <div className="board-frame" aria-label="Playable Othello board">
          <div className="board-grid">
            {board.map((cell, square) => {
              const isLegal = legalMoves.includes(square);

              return (
                <button
                  aria-label={
                    cell === null
                      ? getEmptySquareLabel(square, currentDisc, isLegal)
                      : `Square ${square + 1} has a ${cell} disc`
                  }
                  className={[
                    "board-square",
                    isLegal ? "board-square--legal" : "",
                  ].join(" ")}
                  disabled={!isLegal}
                  key={square}
                  onClick={() => handleSquareClick(square)}
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
