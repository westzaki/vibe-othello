import { describe, expect, it } from "vitest";
import { countDiscs } from "../game/othello";
import { createDebugSession } from "./debugFixtures";

describe("debug fixtures", () => {
  it("creates a black win session", () => {
    const session = createDebugSession("blackWin");

    expect(session.status).toBe("ended");
    expect(session.winner).toBe("black");
    expect(session.flipAnimationId).toBe(0);
    expect(session.flippedSquares).toEqual([]);
    expect(session.lastMove).toBeNull();
    expect(session.discCounts).toEqual({ black: 44, white: 20 });
  });

  it("creates a white win session", () => {
    const session = createDebugSession("whiteWin");

    expect(session.status).toBe("ended");
    expect(session.winner).toBe("white");
    expect(session.discCounts).toEqual({ black: 20, white: 44 });
  });

  it("creates a draw session", () => {
    const session = createDebugSession("draw");

    expect(session.status).toBe("ended");
    expect(session.winner).toBe("draw");
    expect(session.discCounts).toEqual({ black: 32, white: 32 });
  });

  it("creates a near-end playable session", () => {
    const session = createDebugSession("nearEnd");

    expect(session.status).toBe("playing");
    expect(session.currentDisc).toBe("black");
    expect(session.lastMove).toBeNull();
    expect(session.winner).toBeNull();
    expect(countDiscs(session.board)).toEqual({ black: 62, white: 1 });
  });
});
