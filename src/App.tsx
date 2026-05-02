import { useState } from "react";
import {
  createInitialBoard,
  getNextDisc,
  placeDisc,
  type Disc,
} from "./game/othello";

export default function App() {
  const [board, setBoard] = useState(createInitialBoard);
  const [currentDisc, setCurrentDisc] = useState<Disc>("black");

  function handleSquareClick(square: number) {
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
          <p className="eyebrow">Step 2</p>
          <h1 id="game-title">Vibe Othello</h1>
          <p className="turn-status">
            Current turn:
            <span className={`turn-disc turn-disc--${currentDisc}`}>
              {currentDisc}
            </span>
          </p>
        </div>

        <div className="board-frame" aria-label="Playable Othello board">
          <div className="board-grid">
            {board.map((cell, square) => (
              <button
                aria-label={
                  cell === null
                    ? `Place ${currentDisc} disc on square ${square + 1}`
                    : `Square ${square + 1} has a ${cell} disc`
                }
                className="board-square"
                disabled={cell !== null}
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
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
