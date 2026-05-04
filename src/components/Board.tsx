import type {
  Board as OthelloBoard,
  DiscColor,
  SquareIndex,
} from "../game/othello";
import { GameDisc, type DiscFlipAxis } from "./GameDisc";

const columnLabels = ["A", "B", "C", "D", "E", "F", "G", "H"];
const rowLabels = ["1", "2", "3", "4", "5", "6", "7", "8"];

type BoardProps = {
  board: OthelloBoard;
  coachHintMarkers?: BoardHintMarker[];
  currentDisc: DiscColor;
  flipAnimationId: number;
  flippedSquares: SquareIndex[];
  lastMove: SquareIndex | null;
  legalMoves: SquareIndex[];
  onSquareClick: (square: SquareIndex) => void;
  placedSquare: SquareIndex | null;
};

export type BoardHintTone = "helpful" | "risk";
export type BoardHintMarker = {
  square: SquareIndex;
  tone: BoardHintTone;
};

export function Board({
  board,
  coachHintMarkers = [],
  currentDisc,
  flipAnimationId,
  flippedSquares,
  lastMove,
  legalMoves,
  onSquareClick,
  placedSquare,
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
          {board.map((cell, square: SquareIndex) => {
            const isLegal = legalMoves.includes(square);
            const isLastMove = square === lastMove && cell !== null;
            const coachHintMarker = coachHintMarkers.find(
              (marker) => marker.square === square,
            );
            const flipIndex = flippedSquares.indexOf(square);
            const flipMotion =
              flipIndex >= 0 && placedSquare !== null
                ? getFlipMotion(square, placedSquare)
                : null;
            const isPlacedSquare =
              placedSquare === square && flipAnimationId > 0 && cell !== null;

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
                  coachHintMarker !== undefined
                    ? "board-square--coach-hint"
                    : "",
                  coachHintMarker !== undefined
                    ? `board-square--coach-hint-${coachHintMarker.tone}`
                    : "",
                ].join(" ")}
                disabled={!isLegal}
                key={square}
                onClick={() => onSquareClick(square)}
                type="button"
              >
                {cell !== null && (
                  <GameDisc
                    color={cell}
                    flipAxis={flipMotion?.axis ?? null}
                    flipDelay={flipMotion?.delay ?? null}
                    key={
                      flipIndex >= 0
                        ? `${square}-${flipAnimationId}`
                        : isPlacedSquare
                          ? `${square}-${flipAnimationId}-placed`
                        : `${square}-stable`
                    }
                    placeDelay={isPlacedSquare ? 0 : null}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function getFlipMotion(
  square: SquareIndex,
  placedSquare: SquareIndex,
): { axis: DiscFlipAxis; delay: number } {
  const squareRow = Math.floor(square / 8);
  const squareColumn = square % 8;
  const placedRow = Math.floor(placedSquare / 8);
  const placedColumn = placedSquare % 8;
  const rowDelta = squareRow - placedRow;
  const columnDelta = squareColumn - placedColumn;
  const distance = Math.max(Math.abs(rowDelta), Math.abs(columnDelta));
  const directionLength = Math.hypot(rowDelta, columnDelta) || 1;

  return {
    axis: {
      x: -columnDelta / directionLength,
      y: rowDelta / directionLength,
    },
    delay: 115 + Math.max(0, distance - 1) * 48,
  };
}

function getEmptySquareLabel(
  square: SquareIndex,
  currentDisc: DiscColor,
  isLegal: boolean,
): string {
  if (isLegal) {
    return `Place ${currentDisc} disc on square ${square + 1}`;
  }

  return `Square ${square + 1} is not a legal move`;
}
