import {
  getNextDisc,
  hasLegalMove,
  type Board,
  type DiscColor,
} from "./othello";

export type GameSessionNotice = {
  nextDisc: DiscColor;
  skippedDisc: DiscColor;
  type: "pass";
};

export type PlayableTurnResolution = {
  currentDisc: DiscColor;
  notice: GameSessionNotice | null;
};

export function resolvePlayableTurn(
  board: Board,
  preferredDisc: DiscColor,
  fallbackDisc: DiscColor = getNextDisc(preferredDisc),
): PlayableTurnResolution {
  if (hasLegalMove(board, preferredDisc)) {
    return {
      currentDisc: preferredDisc,
      notice: null,
    };
  }

  return {
    currentDisc: fallbackDisc,
    notice: createPassNotice(preferredDisc, fallbackDisc),
  };
}

export function createPassNotice(
  skippedDisc: DiscColor,
  nextDisc: DiscColor,
): GameSessionNotice {
  return {
    nextDisc,
    skippedDisc,
    type: "pass",
  };
}
