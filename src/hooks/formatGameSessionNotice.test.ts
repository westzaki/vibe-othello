import { describe, expect, it } from "vitest";
import { formatGameSessionNotice } from "./formatGameSessionNotice";

describe("formatGameSessionNotice", () => {
  it("formats pass notices for the current game status UI", () => {
    expect(
      formatGameSessionNotice({
        nextDisc: "black",
        skippedDisc: "white",
        type: "pass",
      }),
    ).toBe("White has no legal moves. Black plays again.");
  });

  it("returns null when there is no notice", () => {
    expect(formatGameSessionNotice(null)).toBeNull();
  });
});
