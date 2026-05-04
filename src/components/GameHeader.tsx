import { useState } from "react";
import type { DiscColor, DiscCounts, Winner } from "../game/othello";
import type { GameEndReason, GameStatus } from "../game/session";
import { GameEndConfirmDialog } from "./GameEndConfirmDialog";

type GameHeaderProps = {
  currentDisc: DiscColor;
  discCounts: DiscCounts;
  endReason: GameEndReason | null;
  gameStatus: GameStatus;
  isPlaying: boolean;
  isUndoDisabled: boolean;
  message: string | null;
  onUndo: () => void;
  showUndo: boolean;
  onEndGame: () => void;
  onNewGame: () => void;
  winner: Winner | null;
};

export function GameHeader({
  currentDisc,
  discCounts,
  endReason,
  gameStatus,
  isPlaying,
  isUndoDisabled,
  message,
  onEndGame,
  onNewGame,
  onUndo,
  showUndo,
  winner,
}: GameHeaderProps) {
  const [isEndConfirmOpen, setIsEndConfirmOpen] = useState(false);

  function requestEndGame() {
    setIsEndConfirmOpen(true);
  }

  function cancelEndGame() {
    setIsEndConfirmOpen(false);
  }

  function confirmEndGame() {
    setIsEndConfirmOpen(false);
    onEndGame();
  }

  return (
    <div className="game-heading">
      <h1 id="game-title">Vibe オセロ</h1>
      <div className="game-heading__status">
        <div className="score-row" aria-label="Current score">
          <span className="score-chip score-chip--black">
            黒
            <strong>{discCounts.black}</strong>
          </span>
          <span className="score-chip score-chip--white">
            白
            <strong>{discCounts.white}</strong>
          </span>
        </div>
        <div className="game-status-row">
          {gameStatus !== "playing" && (
            <p className="session-status">
              {getStatusLabel(gameStatus, endReason)}
            </p>
          )}
          {gameStatus === "ended" &&
          endReason === "completed" &&
          winner !== null ? (
            <p className="result-status">
              {getResultLabel(winner, discCounts)}
            </p>
          ) : gameStatus === "ended" && endReason === "abandoned" ? (
            <p className="result-status">Match stopped</p>
          ) : (
            <p className="turn-status">
              <span className={`turn-disc turn-disc--${currentDisc}`}>
                {formatDisc(currentDisc)}
              </span>
              の番
            </p>
          )}
        </div>
        {message !== null && (
          <p className="game-message" role="status">
            {message}
          </p>
        )}
      </div>

      <div className="game-actions" aria-label="Game controls">
        {isPlaying ? (
          <>
            <button
              className="game-action"
              disabled={!showUndo || isUndoDisabled}
              onClick={onUndo}
              type="button"
            >
              まった
            </button>
            <button className="game-action" onClick={requestEndGame} type="button">
              対局をやめる
            </button>
          </>
        ) : (
          <button
            className="game-action game-action--primary"
            onClick={onNewGame}
            type="button"
          >
            タイトルへ
          </button>
        )}
      </div>

      {isPlaying && isEndConfirmOpen && (
        <GameEndConfirmDialog
          onCancel={cancelEndGame}
          onConfirm={confirmEndGame}
        />
      )}
    </div>
  );
}

function getResultLabel(winner: Winner, discCounts: DiscCounts): string {
  const score = `${discCounts.black} - ${discCounts.white}`;

  if (winner === "draw") {
    return `ひきわけ ${score}`;
  }

  return `${winner === "black" ? "黒" : "白"}の勝ち ${score}`;
}

function formatDisc(disc: DiscColor): string {
  return disc === "black" ? "黒" : "白";
}

function getStatusLabel(
  gameStatus: GameStatus,
  endReason: GameEndReason | null,
): string {
  if (gameStatus === "playing") {
    return "対局中";
  }

  if (gameStatus === "ended") {
    return endReason === "completed" ? "最終盤面" : "中断";
  }

  return "準備中";
}
