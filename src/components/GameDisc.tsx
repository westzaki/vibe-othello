import type { CSSProperties } from "react";
import type { DiscColor } from "../game/othello";

type GameDiscProps = {
  color: DiscColor;
  flipAxis?: DiscFlipAxis | null;
  flipDelay?: number | null;
  placeDelay?: number | null;
};

export type DiscFlipAxis = {
  x: number;
  y: number;
};

export function GameDisc({
  color,
  flipAxis = null,
  flipDelay = null,
  placeDelay = null,
}: GameDiscProps) {
  const previousColor = getOppositeColor(color);
  const isFlipped = flipDelay !== null;
  const isPlaced = placeDelay !== null;

  return (
    <span
      aria-hidden="true"
      className={[
        "disc",
        `disc--${color}`,
        isFlipped ? "disc--flipped" : "",
        isPlaced ? "disc--placed" : "",
      ].join(" ")}
      style={
        isFlipped || isPlaced
          ? ({
              "--flip-axis-x": flipAxis?.x ?? 0,
              "--flip-axis-y": flipAxis?.y ?? 1,
              "--flip-delay": `${flipDelay ?? 0}ms`,
              "--place-delay": `${placeDelay ?? 0}ms`,
            } as CSSProperties)
          : undefined
      }
    >
      <span
        className={`disc__face disc__face--front disc__face--${previousColor}`}
      />
      <span className={`disc__face disc__face--back disc__face--${color}`} />
    </span>
  );
}

function getOppositeColor(color: DiscColor): DiscColor {
  return color === "black" ? "white" : "black";
}
