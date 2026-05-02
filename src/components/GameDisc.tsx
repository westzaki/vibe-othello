import type { CSSProperties } from "react";
import type { DiscColor } from "../game/othello";

type GameDiscProps = {
  color: DiscColor;
  flipDelay?: number | null;
};

export function GameDisc({ color, flipDelay = null }: GameDiscProps) {
  return (
    <span
      aria-hidden="true"
      className={[
        "disc",
        `disc--${color}`,
        flipDelay !== null ? "disc--flipped" : "",
      ].join(" ")}
      style={
        flipDelay !== null
          ? ({ "--flip-delay": `${flipDelay}ms` } as CSSProperties)
          : undefined
      }
    />
  );
}
