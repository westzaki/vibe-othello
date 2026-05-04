import type { AppSettings } from "../hooks/useAppSettings";

type SettingsScreenProps = {
  settings: AppSettings;
  onBackToStart: () => void;
  onSoundEnabledChange: (soundEnabled: boolean) => void;
  onUndoEnabledChange: (undoEnabled: boolean) => void;
};

export function SettingsScreen({
  settings,
  onBackToStart,
  onSoundEnabledChange,
  onUndoEnabledChange,
}: SettingsScreenProps) {
  return (
    <section className="settings-screen" aria-labelledby="settings-title">
      <div className="settings-panel">
        <header className="settings-panel__header">
          <p className="settings-panel__eyebrow">あそぶ前のじゅんび</p>
          <h1 id="settings-title">設定</h1>
          <p className="settings-panel__lead">
            使いやすいように、ゲームの感じをえらべます
          </p>
        </header>

        <div className="settings-list" aria-label="設定項目">
          <SettingsToggleItem
            description="石を置いたときなどに音が出ます"
            enabled={settings.soundEnabled}
            label="音をならす"
            onChange={onSoundEnabledChange}
          />
          <SettingsToggleItem
            description="対局中に「まった」を使えるようにします"
            enabled={settings.undoEnabled}
            label="まったを使う"
            onChange={onUndoEnabledChange}
          />
        </div>

        <div className="settings-panel__actions">
          <button className="game-action" onClick={onBackToStart} type="button">
            戻る
          </button>
        </div>
      </div>
    </section>
  );
}

type SettingsToggleItemProps = {
  description: string;
  enabled: boolean;
  label: string;
  onChange: (enabled: boolean) => void;
};

function SettingsToggleItem({
  description,
  enabled,
  label,
  onChange,
}: SettingsToggleItemProps) {
  return (
    <div className="settings-item">
      <div className="settings-item__text">
        <h2>{label}</h2>
        <p>{description}</p>
      </div>
      <button
        aria-checked={enabled}
        className={[
          "settings-toggle",
          enabled ? "settings-toggle--on" : "settings-toggle--off",
        ].join(" ")}
        onClick={() => onChange(!enabled)}
        role="switch"
        type="button"
      >
        <span className="settings-toggle__label">{enabled ? "ON" : "OFF"}</span>
        <span className="settings-toggle__track" aria-hidden="true">
          <span className="settings-toggle__thumb" />
        </span>
      </button>
    </div>
  );
}
