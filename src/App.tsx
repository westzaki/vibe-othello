const boardSquares = Array.from({ length: 64 }, (_, index) => index);

export default function App() {
  return (
    <main className="app">
      <section className="game-shell" aria-labelledby="game-title">
        <div className="game-heading">
          <p className="eyebrow">Step 1</p>
          <h1 id="game-title">Vibe Othello</h1>
        </div>

        <div className="board-frame" aria-label="Empty Othello board">
          <div className="board-grid">
            {boardSquares.map((square) => (
              <div
                aria-label={`Empty square ${square + 1}`}
                className="board-square"
                key={square}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
