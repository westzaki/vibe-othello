import type { Board as OthelloBoard, DiscColor } from "../game/othello";
import { GameDisc } from "./GameDisc";

type BoardProps = {
  board: OthelloBoard;
  currentDisc: DiscColor;
  legalMoves: number[];
  onSquareClick: (square: number) => void;
};

export function Board({
  board,
  currentDisc,
  legalMoves,
  onSquareClick,
}: BoardProps) {
  return (
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
              onClick={() => onSquareClick(square)}
              type="button"
            >
              {cell !== null && <GameDisc color={cell} />}
            </button>
          );
        })}
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
