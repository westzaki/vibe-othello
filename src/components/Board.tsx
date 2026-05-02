import type { Board as OthelloBoard, DiscColor } from "../game/othello";
import { GameDisc } from "./GameDisc";

const columnLabels = ["A", "B", "C", "D", "E", "F", "G", "H"];
const rowLabels = ["1", "2", "3", "4", "5", "6", "7", "8"];

type BoardProps = {
  board: OthelloBoard;
  currentDisc: DiscColor;
  lastMove: number | null;
  legalMoves: number[];
  onSquareClick: (square: number) => void;
};

export function Board({
  board,
  currentDisc,
  lastMove,
  legalMoves,
  onSquareClick,
}: BoardProps) {
  return (
    <div className="board-frame" aria-label="Playable Othello board">
      <div className="board-coordinate-shell">
        <div className="board-coordinate-corner" aria-hidden="true" />
        <div className="board-column-labels" aria-hidden="true">
          {columnLabels.map((label) => (
            <span className="board-coordinate-label" key={label}>
              {label}
            </span>
          ))}
        </div>
        <div className="board-row-labels" aria-hidden="true">
          {rowLabels.map((label) => (
            <span className="board-coordinate-label" key={label}>
              {label}
            </span>
          ))}
        </div>
        <div className="board-grid">
          {board.map((cell, square) => {
            const isLegal = legalMoves.includes(square);
            const isLastMove = square === lastMove && cell !== null;

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
                  isLastMove ? "board-square--last-move" : "",
                ].join(" ")}
                disabled={!isLegal}
                key={square}
                onClick={() => onSquareClick(square)}
                type="button"
              >
                {cell !== null && <GameDisc color={cell} />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function getEmptySquareLabel(
  square: number,
  currentDisc: DiscColor,
  isLegal: boolean,
): string {
  if (isLegal) {
    return `Place ${currentDisc} disc on square ${square + 1}`;
  }

  return `Square ${square + 1} is not a legal move`;
}
