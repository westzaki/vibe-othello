import { countDiscs, getWinner, type Board } from "../game/othello";
import type { GameSession } from "../game/session";

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

export function createDebugSession(name: DebugFixtureName): GameSession {
  if (name === "nearEnd") {
    return createNearEndSession();
  }

  if (name === "passNext") {
    return createPassNextSession();
  }

  const board = createFinishedBoard(name);

  return {
    board,
    currentDisc: "black",
    discCounts: countDiscs(board),
    endReason: "completed",
    lastMove: null,
    message: null,
    status: "ended",
    winner: getWinner(board),
  };
}

function createFinishedBoard(
  name: Exclude<DebugFixtureName, "nearEnd" | "passNext">,
): Board {
  if (name === "blackWin") {
    return Array.from({ length: 64 }, (_, index) =>
      index < 44 ? "black" : "white",
    );
  }

  if (name === "whiteWin") {
    return Array.from({ length: 64 }, (_, index) =>
      index < 20 ? "black" : "white",
    );
  }

  return Array.from({ length: 64 }, (_, index) =>
    index < 32 ? "black" : "white",
  );
}

function createPassNextSession(): GameSession {
  const board: Board = Array.from({ length: 64 }, () => "black");

  board[1] = "white";
  board[2] = null;
  board[4] = "white";
  board[5] = null;

  return {
    board,
    currentDisc: "black",
    discCounts: countDiscs(board),
    endReason: null,
    lastMove: null,
    message: null,
    status: "playing",
    winner: null,
  };
}

function createNearEndSession(): GameSession {
  const board: Board = Array.from({ length: 64 }, () => "black");

  board[1] = "white";
  board[2] = null;

  return {
    board,
    currentDisc: "black",
    discCounts: countDiscs(board),
    endReason: null,
    lastMove: null,
    message: null,
    status: "playing",
    winner: null,
  };
}
