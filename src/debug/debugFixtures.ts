import { countDiscs, getWinner, type Board } from "../game/othello";
import type { GameSession } from "../game/session";

export type DebugFixtureName = "blackWin" | "whiteWin" | "draw" | "nearEnd";

export type DebugFixture = {
  name: DebugFixtureName;
  label: string;
};

export const debugFixtures: DebugFixture[] = [
  { name: "blackWin", label: "Black Win" },
  { name: "whiteWin", label: "White Win" },
  { name: "draw", label: "Draw" },
  { name: "nearEnd", label: "Near End" },
];

export function createDebugSession(name: DebugFixtureName): GameSession {
  if (name === "nearEnd") {
    return createNearEndSession();
  }

  const board = createFinishedBoard(name);

  return {
    board,
    currentDisc: "black",
    discCounts: countDiscs(board),
    status: "ended",
    winner: getWinner(board),
  };
}

function createFinishedBoard(
  name: Exclude<DebugFixtureName, "nearEnd">,
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

function createNearEndSession(): GameSession {
  const board: Board = Array.from({ length: 64 }, () => "black");

  board[1] = "white";
  board[2] = null;

  return {
    board,
    currentDisc: "black",
    discCounts: countDiscs(board),
    status: "playing",
    winner: null,
  };
}
