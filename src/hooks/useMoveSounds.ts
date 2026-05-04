import { useEffect } from "react";
import { playFlipDiscSound, playPlaceDiscSound } from "../audio/gameSounds";
import type { SquareIndex } from "../game/othello";

const firstFlipSoundDelayMs = 115;
const flipSoundDelayMs = 48;

type UseMoveSoundsParams = {
  enabled: boolean;
  flipAnimationId: number;
  flippedSquares: SquareIndex[];
  placedSquare: SquareIndex | null;
};

export function useMoveSounds({
  enabled,
  flipAnimationId,
  flippedSquares,
  placedSquare,
}: UseMoveSoundsParams) {
  useEffect(() => {
    if (!enabled || flipAnimationId === 0) {
      return;
    }

    playPlaceDiscSound();

    const timeoutIds = flippedSquares.map((square, index) =>
      window.setTimeout(
        playFlipDiscSound,
        getFlipSoundDelay(square, placedSquare, index),
      ),
    );

    return () => {
      for (const timeoutId of timeoutIds) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [enabled, flipAnimationId, flippedSquares, placedSquare]);
}

function getFlipSoundDelay(
  square: SquareIndex,
  placedSquare: SquareIndex | null,
  fallbackIndex: number,
): number {
  if (placedSquare === null) {
    return firstFlipSoundDelayMs + fallbackIndex * flipSoundDelayMs;
  }

  const squareRow = Math.floor(square / 8);
  const squareColumn = square % 8;
  const placedRow = Math.floor(placedSquare / 8);
  const placedColumn = placedSquare % 8;
  const distance = Math.max(
    Math.abs(squareRow - placedRow),
    Math.abs(squareColumn - placedColumn),
  );

  return firstFlipSoundDelayMs + Math.max(0, distance - 1) * flipSoundDelayMs;
}
