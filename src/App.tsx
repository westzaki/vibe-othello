import { Board } from "./components/Board";
import { GameHeader } from "./components/GameHeader";
import { useOthelloGame } from "./hooks/useOthelloGame";

export default function App() {
  const game = useOthelloGame();

  return (
    <main className="app">
      <section className="game-shell" aria-labelledby="game-title">
        <GameHeader
          currentDisc={game.currentDisc}
          discCounts={game.discCounts}
          gameStatus={game.gameStatus}
          isPlaying={game.isPlaying}
          onEndGame={game.endGame}
          onNewGame={game.startNewGame}
          winner={game.winner}
        />

        <Board
          board={game.board}
          currentDisc={game.currentDisc}
          legalMoves={game.legalMoves}
          onSquareClick={game.placeCurrentDisc}
        />
      </section>
    </main>
  );
}
