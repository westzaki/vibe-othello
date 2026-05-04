import { useCallback, useState } from "react";
import type { SquareIndex } from "../game/othello";
import type { MoveResult } from "../game/session";

export function useMoveAnimationState() {
  const [flippedSquares, setFlippedSquares] = useState<SquareIndex[]>([]);
  const [flipAnimationId, setFlipAnimationId] = useState(0);
  const [placedSquare, setPlacedSquare] = useState<SquareIndex | null>(null);

  const clearAnimationState = useCallback(() => {
    setFlippedSquares([]);
    setPlacedSquare(null);
  }, []);

  const recordMoveAnimation = useCallback((move: MoveResult) => {
    setFlippedSquares(move.flippedSquares);
    setPlacedSquare(move.placedSquare);
    setFlipAnimationId((currentId) => currentId + 1);
  }, []);

  return {
    clearAnimationState,
    flipAnimationId,
    flippedSquares,
    placedSquare,
    recordMoveAnimation,
  };
}
