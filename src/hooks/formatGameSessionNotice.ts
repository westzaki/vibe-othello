import type { DiscColor } from "../game/othello";
import type { GameSessionNotice } from "../game/session";

export function formatGameSessionNotice(
  notice: GameSessionNotice | null,
): string | null {
  if (notice === null) {
    return null;
  }

  if (notice.type === "pass") {
    return `${formatDisc(notice.skippedDisc)}は置ける場所がないみたい。${formatDisc(
      notice.nextDisc,
    )}がもう一度打つよ。`;
  }

  return null;
}

function formatDisc(disc: DiscColor): string {
  return disc === "black" ? "黒" : "白";
}
