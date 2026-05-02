import type { DiscColor } from "./othello";

export type PlayerType = "human" | "cpu";
export type PlayerSettings = Record<DiscColor, PlayerType>;

export function createDefaultPlayerSettings(): PlayerSettings {
  return {
    black: "human",
    white: "human",
  };
}
