import { GameResultOverlay } from "../components/GameResultOverlay";
import type { DiscCounts, Winner } from "../game/othello";

type ResultScreenProps = {
  discCounts: DiscCounts;
  onBackToStart: () => void;
  onPlayAgain: () => void;
  winner: Winner;
};

export function ResultScreen({
  discCounts,
  onBackToStart,
  onPlayAgain,
  winner,
}: ResultScreenProps) {
  return (
    <GameResultOverlay
      discCounts={discCounts}
      onBackToStart={onBackToStart}
      onPlayAgain={onPlayAgain}
      winner={winner}
    />
  );
}
