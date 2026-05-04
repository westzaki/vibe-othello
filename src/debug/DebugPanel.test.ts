import { describe, expect, it } from "vitest";
import { countDiscs } from "../game/othello";
import { getSessionLegalMoves, placeCurrentDisc } from "../game/session";
import { createDebugSession } from "./debugFixtures";

describe("debug fixtures", () => {
  it("creates a black win session", () => {
    const session = createDebugSession("blackWin");

    expect(session.status).toBe("ended");
    expect(session.winner).toBe("black");
    expect(session.notice).toBeNull();
    expect(session.discCounts).toEqual({ black: 52, white: 12 });
    expect(session.moveHistory).toHaveLength(60);
    expect(session.lastMove).not.toBeNull();
  });

  it("creates a white win session", () => {
    const session = createDebugSession("whiteWin");

    expect(session.status).toBe("ended");
    expect(session.winner).toBe("white");
    expect(session.discCounts).toEqual({ black: 18, white: 46 });
    expect(session.moveHistory).toHaveLength(60);
  });

  it("creates a draw session", () => {
    const session = createDebugSession("draw");

    expect(session.status).toBe("ended");
    expect(session.winner).toBe("draw");
    expect(session.discCounts).toEqual({ black: 32, white: 32 });
    expect(session.moveHistory).toHaveLength(60);
  });

  it("creates a near-end playable session", () => {
    const session = createDebugSession("nearEnd");

    expect(session.status).toBe("playing");
    expect(session.currentDisc).toBe("black");
    expect(session.lastMove).toBe(62);
    expect(session.winner).toBeNull();
    expect(session.moveHistory).toHaveLength(58);
    expect(countDiscs(session.board)).toEqual({ black: 32, white: 30 });
  });

  it("creates a session that can trigger a pass on the next move", () => {
    const session = createDebugSession("passNext");

    expect(session.status).toBe("playing");
    expect(session.currentDisc).toBe("white");
    expect(session.moveHistory).toHaveLength(57);
    expect(getSessionLegalMoves(session)).toContain(10);

    const result = placeCurrentDisc(session, 10).session;

    expect(result.status).toBe("playing");
    expect(result.currentDisc).toBe("white");
    expect(result.notice).toEqual({
      nextDisc: "white",
      skippedDisc: "black",
      type: "pass",
    });
  });
});
