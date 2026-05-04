import { describe, expect, it } from "vitest";
import { createInitialBoard, getLegalMoves } from "../game/othello";
import { chooseCpuMoveAsync } from "./cpuMoveService";

describe("CPU move service", () => {
  it("returns the request id with a selected CPU move", async () => {
    const board = createInitialBoard();
    const response = await chooseCpuMoveAsync({
      board,
      disc: "black",
      level: "level1",
      requestId: "opening-move",
    });

    expect(response.requestId).toBe("opening-move");
    expect(getLegalMoves(board, "black")).toContain(response.move);
  });
});
