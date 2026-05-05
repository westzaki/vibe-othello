import { describe, expect, it } from "vitest";
import { boardColumnLabels, boardRowLabels, formatSquare } from "./squareLabels";

describe("square labels", () => {
  it("provides board coordinate labels", () => {
    expect(boardColumnLabels).toEqual(["A", "B", "C", "D", "E", "F", "G", "H"]);
    expect(boardRowLabels).toEqual(["1", "2", "3", "4", "5", "6", "7", "8"]);
  });

  it("formats square indexes as board coordinates", () => {
    expect(formatSquare(0)).toBe("A1");
    expect(formatSquare(7)).toBe("H1");
    expect(formatSquare(56)).toBe("A8");
    expect(formatSquare(63)).toBe("H8");
  });
});
