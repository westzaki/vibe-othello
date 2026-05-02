import type { DiscColor } from "../game/othello";
import type { CpuLevel, PlayerSettings, PlayerType } from "../game/players";

const discs: DiscColor[] = ["black", "white"];
const playerTypes: PlayerType[] = ["human", "cpu"];
const cpuLevels: CpuLevel[] = ["level1", "level2", "level3"];

type PlayerControlsProps = {
  onCpuLevelChange: (disc: DiscColor, cpuLevel: CpuLevel) => void;
  onPlayerTypeChange: (disc: DiscColor, playerType: PlayerType) => void;
  players: PlayerSettings;
};

export function PlayerControls({
  onCpuLevelChange,
  onPlayerTypeChange,
  players,
}: PlayerControlsProps) {
  return (
    <div className="player-controls" aria-label="Player controls">
      {discs.map((disc) => (
        <div className="player-control" key={disc}>
          <span
            className={`player-control__label player-control__label--${disc}`}
          >
            {disc}
          </span>
          <div className="player-control__options">
            {playerTypes.map((playerType) => (
              <button
                aria-pressed={players[disc].type === playerType}
                className={[
                  "player-control__option",
                  players[disc].type === playerType
                    ? "player-control__option--selected"
                    : "",
                ].join(" ")}
                key={playerType}
                onClick={() => onPlayerTypeChange(disc, playerType)}
                type="button"
              >
                {playerType}
              </button>
            ))}
          </div>
          {players[disc].type === "cpu" && (
            <div
              className="player-control__options player-control__options--levels"
              aria-label={`${disc} CPU level`}
            >
              {cpuLevels.map((cpuLevel) => (
                <button
                  aria-pressed={players[disc].cpuLevel === cpuLevel}
                  className={[
                    "player-control__option",
                    "player-control__option--level",
                    players[disc].cpuLevel === cpuLevel
                      ? "player-control__option--selected"
                      : "",
                  ].join(" ")}
                  key={cpuLevel}
                  onClick={() => onCpuLevelChange(disc, cpuLevel)}
                  type="button"
                >
                  {cpuLevel}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
