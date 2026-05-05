import type { DiscColor } from "../../game/othello";
import type { GameSessionNotice } from "../../game/session";

type PassNoticeOverlayProps = {
  notice: GameSessionNotice;
};

export function PassNoticeOverlay({ notice }: PassNoticeOverlayProps) {
  return (
    <div className="pass-notice-overlay" role="status" aria-live="polite">
      <div className="pass-notice-overlay__card">
        <span
          className={`pass-notice-overlay__disc pass-notice-overlay__disc--${notice.skippedDisc}`}
          aria-hidden="true"
        />
        <div>
          <p className="pass-notice-overlay__title">
            {formatDisc(notice.skippedDisc)}は置ける場所がないみたい
          </p>
          <p className="pass-notice-overlay__text">
            {formatDisc(notice.nextDisc)}がもう一度打つよ
          </p>
        </div>
      </div>
    </div>
  );
}

function formatDisc(disc: DiscColor): string {
  return disc === "black" ? "黒" : "白";
}
