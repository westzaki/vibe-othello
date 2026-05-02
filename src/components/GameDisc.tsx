import type { DiscColor } from "../game/othello";

type GameDiscProps = {
  color: DiscColor;
};

export function GameDisc({ color }: GameDiscProps) {
  return <span aria-hidden="true" className={`disc disc--${color}`} />;
}
