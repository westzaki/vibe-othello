import { Board } from "../components/Board";
import { GameResultOverlay } from "../components/GameResultOverlay";
import type { useOthelloGame } from "../hooks/useOthelloGame";

type ResultScreenProps = {
  game: ReturnType<typeof useOthelloGame>;
  onBackToStart: () => void;
  onPlayAgain: () => void;
};

export function ResultScreen({
  game,
  onBackToStart,
  onPlayAgain,
}: ResultScreenProps) {
  if (game.winner === null) {
    return null;
  }

  return (
    <section
      className="game-shell result-screen"
      aria-labelledby="result-title"
    >
      <aside className="game-sidebar result-sidebar" aria-label="Game result">
        <GameResultOverlay
          discCounts={game.discCounts}
          onBackToStart={onBackToStart}
          onPlayAgain={onPlayAgain}
          winner={game.winner}
        />
      </aside>

      <div className="game-table">
        <Board
          board={game.board}
          currentDisc={game.currentDisc}
          flipAnimationId={game.flipAnimationId}
          flippedSquares={[]}
          lastMove={game.lastMove}
          legalMoves={[]}
          onSquareClick={() => undefined}
        />
      </div>
    </section>
  );
}
