import type { DiscColor } from "../game/othello";
import type { GameSessionNotice } from "../game/session";

export function formatGameSessionNotice(
  notice: GameSessionNotice | null,
): string | null {
  if (notice === null) {
    return null;
  }

  if (notice.type === "pass") {
    return `${formatDisc(notice.skippedDisc)} has no legal moves. ${formatDisc(
      notice.nextDisc,
    )} plays again.`;
  }

  return null;
}

function formatDisc(disc: DiscColor): string {
  return disc === "black" ? "Black" : "White";
}
