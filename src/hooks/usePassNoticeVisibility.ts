import { useEffect, useState } from "react";
import type { SquareIndex } from "../game/othello";
import type { GameSessionNotice } from "../game/session";

const passNoticeVisibleMs = 2400;

type UsePassNoticeVisibilityParams = {
  lastMove: SquareIndex | null;
  moveCount: number;
  notice: GameSessionNotice | null;
};

export function usePassNoticeVisibility({
  lastMove,
  moveCount,
  notice,
}: UsePassNoticeVisibilityParams) {
  const passNotice = notice?.type === "pass" ? notice : null;
  const passNoticeKey =
    passNotice === null
      ? null
      : [
          moveCount,
          lastMove ?? "none",
          passNotice.skippedDisc,
          passNotice.nextDisc,
        ].join(":");
  const [hiddenPassNoticeKey, setHiddenPassNoticeKey] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (passNoticeKey === null) {
      const resetTimeoutId = window.setTimeout(() => {
        setHiddenPassNoticeKey(null);
      }, 0);

      return () => window.clearTimeout(resetTimeoutId);
    }

    const timeoutId = window.setTimeout(() => {
      setHiddenPassNoticeKey(passNoticeKey);
    }, passNoticeVisibleMs);

    return () => window.clearTimeout(timeoutId);
  }, [passNoticeKey]);

  return {
    isPassNoticeVisible:
      passNotice !== null &&
      passNoticeKey !== null &&
      hiddenPassNoticeKey !== passNoticeKey,
    passNotice,
  };
}
