import type { MoveRecord } from "../game/session";

type MoveHistoryProps = {
  moves: MoveRecord[];
};

export function MoveHistory({ moves }: MoveHistoryProps) {
  const recentMoves = moves.slice().reverse();

  return (
    <section className="move-history" aria-labelledby="move-history-title">
      <div className="move-history__header">
        <h2 id="move-history-title" className="move-history__title">
          Move History
        </h2>
        <span className="move-history__count">{moves.length}</span>
      </div>

      {recentMoves.length === 0 ? (
        <p className="move-history__empty">No moves yet</p>
      ) : (
        <ol className="move-history__list" aria-label="Played moves">
          {recentMoves.map((move) => (
            <li className="move-history__item" key={move.moveNumber}>
              <span
                className={`move-history__disc move-history__disc--${move.disc}`}
                aria-hidden="true"
              />
              <span className="move-history__main">
                <span className="move-history__move-number">
                  #{move.moveNumber}
                </span>
                <span className="move-history__square">
                  {formatSquare(move.square)}
                </span>
              </span>
              <span className="move-history__flips">
                +{move.flippedSquares.length}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function formatSquare(square: number): string {
  const column = String.fromCharCode("A".charCodeAt(0) + (square % 8));
  const row = Math.floor(square / 8) + 1;

  return `${column}${row}`;
}
