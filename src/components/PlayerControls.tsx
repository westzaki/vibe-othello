import type { DiscColor } from "../game/othello";
import type { PlayerSettings, PlayerType } from "../game/players";

const discs: DiscColor[] = ["black", "white"];
const playerTypes: PlayerType[] = ["human", "cpu"];

type PlayerControlsProps = {
  onPlayerTypeChange: (disc: DiscColor, playerType: PlayerType) => void;
  players: PlayerSettings;
};

export function PlayerControls({
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
                aria-pressed={players[disc] === playerType}
                className={[
                  "player-control__option",
                  players[disc] === playerType
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
        </div>
      ))}
    </div>
  );
}
