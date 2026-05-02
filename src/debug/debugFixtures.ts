import type { SquareIndex } from "../game/othello";
import {
  placeCurrentDisc,
  startNewGame,
  type GameSession,
} from "../game/session";

export type DebugFixtureName =
  | "blackWin"
  | "whiteWin"
  | "draw"
  | "nearEnd"
  | "passNext";

export type DebugFixture = {
  name: DebugFixtureName;
  label: string;
};

export const debugFixtures: DebugFixture[] = [
  { name: "blackWin", label: "Black Win" },
  { name: "whiteWin", label: "White Win" },
  { name: "draw", label: "Draw" },
  { name: "nearEnd", label: "Near End" },
  { name: "passNext", label: "Pass Next" },
];

const drawMoveSequence = [
  19, 34, 41, 33, 44, 48, 32, 25, 16, 20, 43, 37, 26, 52, 40, 18, 50, 29, 30,
  57, 59, 22, 56, 17, 45, 31, 9, 61, 12, 21, 42, 3, 58, 49, 5, 1, 15, 13, 24,
  11, 14, 54, 38, 23, 8, 10, 6, 53, 51, 46, 47, 55, 4, 7, 63, 60, 39, 62, 2, 0,
];
const blackWinMoveSequence = [
  26, 18, 37, 45, 10, 9, 44, 29, 22, 43, 0, 30, 34, 19, 52, 50, 38, 54, 63, 17,
  20, 53, 25, 23, 31, 8, 24, 1, 11, 16, 33, 12, 42, 49, 5, 41, 21, 14, 15, 55,
  4, 3, 48, 46, 13, 6, 58, 51, 7, 32, 56, 57, 2, 59, 47, 39, 60, 61, 62, 40,
];
const whiteWinMoveSequence = [
  44, 43, 34, 29, 21, 20, 51, 52, 22, 59, 13, 14, 15, 25, 41, 7, 61, 23, 16, 26,
  18, 19, 31, 53, 62, 50, 60, 12, 5, 32, 30, 11, 24, 17, 4, 6, 49, 33, 45, 46,
  54, 38, 42, 57, 10, 2, 37, 39, 47, 8, 1, 40, 48, 56, 58, 63, 9, 3, 55, 0,
];
const passNextMoveSequence = [
  37, 29, 20, 45, 46, 12, 44, 53, 21, 55, 30, 31, 4, 13, 18, 9, 23, 3, 19, 42,
  17, 11, 0, 25, 34, 43, 22, 5, 50, 38, 47, 14, 60, 39, 41, 62, 15, 52, 6, 16,
  33, 26, 2, 49, 56, 8, 24, 1, 61, 58, 51, 59, 63, 32, 40, 54, 57,
];

export function createDebugSession(name: DebugFixtureName): GameSession {
  if (name === "nearEnd") {
    return createNearEndSession();
  }

  if (name === "passNext") {
    return createPassNextSession();
  }

  if (name === "blackWin") {
    return playDebugMoves(blackWinMoveSequence);
  }

  if (name === "whiteWin") {
    return playDebugMoves(whiteWinMoveSequence);
  }

  return playDebugMoves(drawMoveSequence);
}

function createPassNextSession(): GameSession {
  return playDebugMoves(passNextMoveSequence);
}

function playDebugMoves(moves: SquareIndex[]): GameSession {
  let session = startNewGame();

  for (const move of moves) {
    if (session.status !== "playing") {
      break;
    }

    session = placeCurrentDisc(session, move).session;
  }

  return session;
}

function createNearEndSession(): GameSession {
  return playDebugMoves(drawMoveSequence.slice(0, -2));
}
