import type { MoveRecord } from "../game/session";
import { formatSquare } from "../game/squareLabels";

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
                    {move.moveNumber}手目
                  </span>
                  <span className="move-history__square">
                    {formatSquare(move.square)}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </details>
  );
}
