import { useCallback, useState } from "react";
import type { SquareIndex } from "../game/othello";
import type { MoveResult } from "../game/session";

export function useMoveAnimationState() {
  const [flippedSquares, setFlippedSquares] = useState<SquareIndex[]>([]);
  const [flipAnimationId, setFlipAnimationId] = useState(0);

  const clearAnimationState = useCallback(() => {
    setFlippedSquares([]);
  }, []);

  const recordMoveAnimation = useCallback((move: MoveResult) => {
    setFlippedSquares(move.flippedSquares);
    setFlipAnimationId((currentId) => currentId + 1);
  }, []);

  return {
    clearAnimationState,
    flipAnimationId,
    flippedSquares,
    recordMoveAnimation,
  };
}
