import type { SquareIndex } from "../game/othello";
import type { MoveRecord } from "../game/session";

type MoveHistoryProps = {
  moves: MoveRecord[];
};

export function MoveHistory({ moves }: MoveHistoryProps) {
  const recentMoves = moves.slice().reverse();

  return (
    <details className="move-history">
      <summary className="move-history__summary">
        <span id="move-history-title" className="move-history__title">
          手順を見る
        </span>
        <span className="move-history__count">{moves.length}</span>
      </summary>

      <div className="move-history__body" aria-labelledby="move-history-title">
        {recentMoves.length === 0 ? (
          <p className="move-history__empty">まだ手はありません</p>
        ) : (
          <ol className="move-history__list" aria-label="打った手">
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
      </div>
    </details>
  );
}

function formatSquare(square: SquareIndex): string {
  const column = String.fromCharCode("A".charCodeAt(0) + (square % 8));
  const row = Math.floor(square / 8) + 1;

  return `${column}${row}`;
}
