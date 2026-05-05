import type { GameSession } from "../game/session";
import { canShowCoachBestMoveHint, type CoachHint } from "../teacher";

export function shouldContinuePollingForBestMoveHint({
  hints,
  session,
}: {
  hints: CoachHint[];
  session: GameSession;
}): boolean {
  return (
    canShowCoachBestMoveHint(session) &&
    !hints.some((hint) => hint.kind === "bestMove")
  );
}
