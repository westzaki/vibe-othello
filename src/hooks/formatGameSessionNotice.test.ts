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
    ).toBe("白は置ける場所がないみたい。黒がもう一度打つよ。");
  });

  it("returns null when there is no notice", () => {
    expect(formatGameSessionNotice(null)).toBeNull();
  });
});
