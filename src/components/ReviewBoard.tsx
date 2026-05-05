import type { Board, SquareIndex } from "../game/othello";
import {
  boardColumnLabels,
  boardRowLabels,
  formatSquare,
} from "../game/squareLabels";
import { GameDisc } from "./GameDisc";

type ReviewBoardProps = {
  bestSquare: SquareIndex | null;
  board: Board;
  legalMoves: SquareIndex[];
  playedSquare: SquareIndex | null;
};

export function ReviewBoard({
  bestSquare,
  board,
  legalMoves,
  playedSquare,
}: ReviewBoardProps) {
  return (
    <div className="review-board" aria-label="Review playback board">
      <div className="board-coordinate-shell">
        <div className="board-coordinate-corner" aria-hidden="true" />
        <div className="board-column-labels" aria-hidden="true">
          {boardColumnLabels.map((label) => (
            <span className="board-coordinate-label" key={label}>
              {label}
            </span>
          ))}
        </div>
        <div className="board-row-labels" aria-hidden="true">
          {boardRowLabels.map((label) => (
            <span className="board-coordinate-label" key={label}>
              {label}
            </span>
          ))}
        </div>
        <div className="board-grid">
          {board.map((cell, square: SquareIndex) => {
            const isLegal = legalMoves.includes(square);
            const isPlayed = square === playedSquare;
            const isBest = square === bestSquare;

            return (
              <div
                aria-label={getReviewSquareLabel(
                  square,
                  isLegal,
                  isPlayed,
                  isBest,
                )}
                className={[
                  "board-square",
                  "review-board__square",
                  isLegal ? "review-board__square--legal" : "",
                  isPlayed ? "review-board__square--played" : "",
                  isBest ? "review-board__square--best" : "",
                ].join(" ")}
                key={square}
              >
                {cell !== null && <GameDisc color={cell} />}
                {isLegal && <span className="review-board__legal-dot" />}
                {(isPlayed || isBest) && (
                  <span className="review-board__marker">
                    {getMarkerText(isPlayed, isBest)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function getMarkerText(isPlayed: boolean, isBest: boolean): string {
  if (isPlayed && isBest) {
    return "実/試";
  }

  if (isPlayed) {
    return "実";
  }

  return "試";
}

function getReviewSquareLabel(
  square: SquareIndex,
  isLegal: boolean,
  isPlayed: boolean,
  isBest: boolean,
): string {
  const tags = [
    isLegal ? "placeable square" : null,
    isPlayed ? "played move" : null,
    isBest ? "try move" : null,
  ].filter(Boolean);
  const suffix = tags.length > 0 ? `: ${tags.join(", ")}` : "";

  return `${formatSquare(square)}${suffix}`;
}
