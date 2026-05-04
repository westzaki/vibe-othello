type GameEndConfirmDialogProps = {
  onCancel: () => void;
  onConfirm: () => void;
};

export function GameEndConfirmDialog({
  onCancel,
  onConfirm,
}: GameEndConfirmDialogProps) {
  return (
    <div
      className="game-end-confirm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-end-confirm-title"
      aria-describedby="game-end-confirm-description"
    >
      <div className="game-end-confirm__card">
        <div className="game-end-confirm__copy">
          <p id="game-end-confirm-title" className="game-end-confirm__title">
            この対局をおわりますか？
          </p>
          <p
            id="game-end-confirm-description"
            className="game-end-confirm__description"
          >
            今の対局は中断されます
          </p>
        </div>
        <div className="game-end-confirm__actions">
          <button className="game-action" onClick={onCancel} type="button">
            対局にもどる
          </button>
          <button
            className="game-action game-action--danger"
            onClick={onConfirm}
            type="button"
          >
            対局をおわる
          </button>
        </div>
      </div>
    </div>
  );
}
